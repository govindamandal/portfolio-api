const { z } = require('zod')
const { requireAdmin } = require('../lib/auth')
const { sendMethodNotAllowed } = require('../lib/http')
const { createUploadUrl } = require('../lib/r2')

async function createAssetUploadUrl(req, res) {
  await requireAdmin(req)

  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, ['POST'])
  }

  const schema = z.object({
    fileName: z.string().min(1),
    contentType: z.string().min(3)
  })
  const parsed = schema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ error: 'fileName and contentType are required' })
  }

  return res.json(await createUploadUrl(parsed.data))
}

module.exports = { createAssetUploadUrl }
