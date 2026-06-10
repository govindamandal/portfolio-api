const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { requireEnv } = require('./env')

async function createUploadUrl({ fileName, contentType }) {
  const accountId = requireEnv('CLOUDFLARE_R2_ACCOUNT_ID')
  const bucket = requireEnv('CLOUDFLARE_R2_BUCKET')
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || ''
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase()
  const key = `portfolio/${Date.now()}-${safeName}`

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv('CLOUDFLARE_R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('CLOUDFLARE_R2_SECRET_ACCESS_KEY')
    }
  })

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType
  })

  return {
    uploadUrl: await getSignedUrl(s3, command, { expiresIn: 300 }),
    key,
    publicUrl: publicUrl ? `${publicUrl.replace(/\/$/, '')}/${key}` : null
  }
}

module.exports = { createUploadUrl }
