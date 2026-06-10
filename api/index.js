const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');
const { z } = require('zod');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const app = express();
const port = process.env.PORT || 3000;
const cookieName = process.env.ADMIN_COOKIE_NAME || 'portfolio_admin_token';
const allowedCollections = new Set([
  'profile',
  'experiences',
  'projects',
  'skills',
  'certifications',
  'courses',
  'testimonials',
  'siteSettings',
  'assets'
]);
const listCollections = [
  'experiences',
  'projects',
  'skills',
  'certifications',
  'courses',
  'testimonials'
];

let mongoClient;
let cachedDb;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

async function getDb() {
  if (cachedDb) {
    return cachedDb;
  }

  const uri = requireEnv('MONGODB_URI');
  mongoClient = mongoClient || new MongoClient(uri);
  await mongoClient.connect();
  cachedDb = mongoClient.db(process.env.MONGODB_DB || 'portfolio');
  return cachedDb;
}

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((cookies, item) => {
    const [rawKey, ...rawValue] = item.trim().split('=');
    if (!rawKey) {
      return cookies;
    }
    cookies[rawKey] = decodeURIComponent(rawValue.join('='));
    return cookies;
  }, {});
}

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role },
    requireEnv('JWT_SECRET'),
    { expiresIn: '7d' }
  );
}

function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    `${cookieName}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=None; ${isProduction ? 'Secure;' : ''}`
  );
}

function clearAuthCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${cookieName}=; HttpOnly; Path=/; Max-Age=0; SameSite=None; Secure;`
  );
}

async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const cookieToken = parseCookies(req.headers.cookie)[cookieName];
    const token = bearerToken || cookieToken;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = jwt.verify(token, requireEnv('JWT_SECRET'));
    if (payload.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.admin = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

function serializeDocument(document) {
  if (!document) {
    return null;
  }
  return {
    ...document,
    _id: document._id?.toString()
  };
}

function publicFilter() {
  return {
    $or: [
      { isPublic: { $exists: false } },
      { isPublic: true }
    ]
  };
}

function sortForCollection(collection) {
  if (collection === 'skills') {
    return { displayOrder: 1, name: 1 };
  }
  if (collection === 'experiences') {
    return { startDate: -1, displayOrder: 1 };
  }
  return { featured: -1, displayOrder: 1, createdAt: -1 };
}

app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(cors({
  origin(origin, callback) {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,https://govindamandal.github.io')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
}));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'portfolio-api' });
});

app.post('/api/auth/login', async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
  });
  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Valid email and password are required' });
  }

  const db = await getDb();
  const user = await db.collection('users').findOne({
    email: parsed.data.email.toLowerCase(),
    role: 'admin',
    isActive: { $ne: false }
  });

  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken(user);
  setAuthCookie(res, token);
  return res.json({
    token,
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name || 'Admin'
    }
  });
});

app.post('/api/auth/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

app.get('/api/auth/me', requireAdmin, (req, res) => {
  res.json({ user: req.admin });
});

app.get('/api/public/site', async (req, res) => {
  const db = await getDb();
  const [profile, siteSettings, ...lists] = await Promise.all([
    db.collection('profile').findOne(publicFilter()),
    db.collection('siteSettings').findOne({ key: 'default' }),
    ...listCollections.map((collection) => (
      db.collection(collection).find(publicFilter()).sort(sortForCollection(collection)).toArray()
    ))
  ]);

  res.json({
    profile: serializeDocument(profile),
    siteSettings: serializeDocument(siteSettings),
    experiences: lists[0].map(serializeDocument),
    projects: lists[1].map(serializeDocument),
    skills: lists[2].map(serializeDocument),
    certifications: lists[3].map(serializeDocument),
    courses: lists[4].map(serializeDocument),
    testimonials: lists[5].map(serializeDocument)
  });
});

app.get('/api/public/:collection', async (req, res) => {
  const { collection } = req.params;
  if (!allowedCollections.has(collection)) {
    return res.status(404).json({ error: 'Unknown collection' });
  }

  const db = await getDb();
  const documents = await db.collection(collection)
    .find(publicFilter())
    .sort(sortForCollection(collection))
    .toArray();

  return res.json({ items: documents.map(serializeDocument) });
});

app.post('/api/contact', async (req, res) => {
  const schema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    message: z.string().min(10).max(3000)
  });
  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Please provide a valid name, email, and message' });
  }

  const db = await getDb();
  await db.collection('contactMessages').insertOne({
    ...parsed.data,
    status: 'new',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  return res.status(201).json({ ok: true });
});

app.get('/api/admin/:collection', requireAdmin, async (req, res) => {
  const { collection } = req.params;
  if (!allowedCollections.has(collection)) {
    return res.status(404).json({ error: 'Unknown collection' });
  }

  const db = await getDb();
  const items = await db.collection(collection).find({}).sort(sortForCollection(collection)).toArray();
  return res.json({ items: items.map(serializeDocument) });
});

app.post('/api/admin/:collection', requireAdmin, async (req, res) => {
  const { collection } = req.params;
  if (!allowedCollections.has(collection)) {
    return res.status(404).json({ error: 'Unknown collection' });
  }

  const now = new Date();
  const db = await getDb();
  const document = {
    ...req.body,
    createdAt: now,
    updatedAt: now
  };
  const result = await db.collection(collection).insertOne(document);
  return res.status(201).json({ item: serializeDocument({ _id: result.insertedId, ...document }) });
});

app.put('/api/admin/:collection/:id', requireAdmin, async (req, res) => {
  const { collection, id } = req.params;
  if (!allowedCollections.has(collection) || !ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'Unknown resource' });
  }

  const db = await getDb();
  const updates = {
    ...req.body,
    updatedAt: new Date()
  };
  delete updates._id;

  await db.collection(collection).updateOne(
    { _id: new ObjectId(id) },
    { $set: updates }
  );
  const item = await db.collection(collection).findOne({ _id: new ObjectId(id) });
  return res.json({ item: serializeDocument(item) });
});

app.delete('/api/admin/:collection/:id', requireAdmin, async (req, res) => {
  const { collection, id } = req.params;
  if (!allowedCollections.has(collection) || !ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'Unknown resource' });
  }

  const db = await getDb();
  await db.collection(collection).deleteOne({ _id: new ObjectId(id) });
  return res.json({ ok: true });
});

app.post('/api/admin/assets/upload-url', requireAdmin, async (req, res) => {
  const schema = z.object({
    fileName: z.string().min(1),
    contentType: z.string().min(3)
  });
  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'fileName and contentType are required' });
  }

  const accountId = requireEnv('CLOUDFLARE_R2_ACCOUNT_ID');
  const bucket = requireEnv('CLOUDFLARE_R2_BUCKET');
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || '';
  const safeName = parsed.data.fileName.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
  const key = `portfolio/${Date.now()}-${safeName}`;
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv('CLOUDFLARE_R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('CLOUDFLARE_R2_SECRET_ACCESS_KEY')
    }
  });

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: parsed.data.contentType
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  return res.json({
    uploadUrl,
    key,
    publicUrl: publicUrl ? `${publicUrl.replace(/\/$/, '')}/${key}` : null
  });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Something went wrong' });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Portfolio API running on http://localhost:${port}`);
  });
}

module.exports = app;
