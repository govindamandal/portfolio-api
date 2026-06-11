const { z } = require('zod')
const { requireAdmin } = require('../lib/auth')
const { connectDb } = require('../lib/db')
const { sendMethodNotAllowed } = require('../lib/http')
const { createUploadUrl } = require('../lib/r2')
const { Asset } = require('../models')

async function createAssetUploadUrl(req, res) {
  await requireAdmin(req)

  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, ['POST'])
  }

  const schema = z.object({
    fileName: z.string().min(1),
    contentType: z.string().min(3),
    size: z.number().optional()
  })
  const parsed = schema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ error: 'fileName and contentType are required' })
  }

  const upload = await createUploadUrl(parsed.data)

  await connectDb()
  const asset = await Asset.create({
    key: upload.key,
    publicUrl: upload.publicUrl,
    fileName: upload.fileName,
    contentType: upload.contentType,
    size: parsed.data.size,
    source: 'r2'
  })

  return res.json({
    ...upload,
    assetId: asset._id.toString()
  })
}

module.exports = { createAssetUploadUrl }
