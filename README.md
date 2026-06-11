# Portfolio API

Next.js API for the dynamic portfolio and admin panel.

## Structure

```text
pages/api/          Route files
src/models/         Mongoose models
src/services/       Data access and business logic
src/controllers/    Request handlers
src/lib/            DB, auth, CORS, R2 helpers
```

## Environment Variables

Copy `.env.example` into Vercel Project Settings and fill the real values:

- `MONGODB_URI`
- `MONGODB_DB`
- `JWT_SECRET`
- `ALLOWED_ORIGINS`
- `CLOUDFLARE_R2_ACCOUNT_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET`
- `CLOUDFLARE_R2_PUBLIC_URL`
- `API_PUBLIC_URL`
- `EMAILJS_SERVICE_ID`
- `EMAILJS_TEMPLATE_ID`
- `EMAILJS_PUBLIC_KEY`
- `EMAILJS_PRIVATE_KEY`

`CLOUDFLARE_R2_PUBLIC_URL` must be a browser-loadable R2 public development URL, such as `https://pub-xxxxx.r2.dev`, or a custom R2 domain. Do not use `https://<account_id>.r2.cloudflarestorage.com` here; that is the private S3 API endpoint and browsers will receive an authorization XML error.

If you do not want to expose the R2 bucket publicly, leave `CLOUDFLARE_R2_PUBLIC_URL` empty and set `API_PUBLIC_URL` to the deployed API origin. The API will serve saved assets from `/api/assets/...`.

EmailJS sends contact form notifications from `POST /api/contact`. The recipient email is read from the public profile document in MongoDB. Your EmailJS template should support these variables:

- `to_email`
- `to_name`
- `from_name`
- `from_email`
- `reply_to`
- `message`

For the old portfolio, the existing EmailJS values were `service_getan9a`, `template_z40vh5b`, and public key `A_VOPig4TVoVBb50T`. Put them in Vercel only if you still want to reuse the same EmailJS account/template.

## Admin User

There is no signup endpoint. Insert one admin user manually in MongoDB:

```js
db.users.insertOne({
  email: "you@example.com",
  name: "Govinda Mandal",
  role: "admin",
  isActive: true,
  passwordHash: "$2a$10$REPLACE_WITH_BCRYPT_HASH",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Generate a bcrypt hash locally:

```bash
node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('your-password', 10).then(console.log)"
```

## Endpoints

- `GET /api/health`
- `GET /api/public/site`
- `GET /api/public/:collection`
- `GET /api/projects/:slug`
- `POST /api/contact`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/admin/:collection`
- `POST /api/admin/:collection`
- `PUT /api/admin/:collection/:id`
- `DELETE /api/admin/:collection/:id`
- `POST /api/admin/assets/upload-url`
- `GET /api/assets/:key`
