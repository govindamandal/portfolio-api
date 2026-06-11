const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { requireEnv } = require('./env')

function getR2Client() {
  const accountId = requireEnv('CLOUDFLARE_R2_ACCOUNT_ID')

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv('CLOUDFLARE_R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('CLOUDFLARE_R2_SECRET_ACCESS_KEY')
    }
  })
}

function getApiBaseUrl() {
  if (process.env.API_PUBLIC_URL) {
    return process.env.API_PUBLIC_URL.replace(/\/$/, '')
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return ''
}

function isPrivateR2Endpoint(url) {
  try {
    return new URL(url).hostname.endsWith('.r2.cloudflarestorage.com')
  } catch {
    return false
  }
}

function getAssetPublicUrl(key) {
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || ''
  const normalizedKey = key.replace(/^\/+/, '')

  if (publicUrl && !isPrivateR2Endpoint(publicUrl)) {
    return `${publicUrl.replace(/\/$/, '')}/${normalizedKey}`
  }

  const apiBaseUrl = getApiBaseUrl()
  return `${apiBaseUrl}/api/assets/${normalizedKey}`
}

function extractR2KeyFromUrl(value) {
  if (!isPrivateR2Endpoint(value)) {
    return ''
  }

  const bucket = process.env.CLOUDFLARE_R2_BUCKET || ''
  const pathname = new URL(value).pathname.replace(/^\/+/, '')

  if (bucket && pathname.startsWith(`${bucket}/`)) {
    return pathname.slice(bucket.length + 1)
  }

  return pathname
}

async function createUploadUrl({ fileName, contentType }) {
  const bucket = requireEnv('CLOUDFLARE_R2_BUCKET')
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase()
  const key = `portfolio/${Date.now()}-${safeName}`
  const s3 = getR2Client()

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType
  })

  return {
    uploadUrl: await getSignedUrl(s3, command, { expiresIn: 300 }),
    key,
    fileName,
    contentType,
    publicUrl: getAssetPublicUrl(key)
  }
}

function getObject(key) {
  return getR2Client().send(new GetObjectCommand({
    Bucket: requireEnv('CLOUDFLARE_R2_BUCKET'),
    Key: key
  }))
}

function normalizeAssetUrl(value) {
  const key = extractR2KeyFromUrl(value)
  return key ? getAssetPublicUrl(key) : value
}

module.exports = { createUploadUrl, getAssetPublicUrl, getObject, normalizeAssetUrl }
