const { z } = require('zod')
const { connectDb } = require('../lib/db')
const { sendMethodNotAllowed } = require('../lib/http')
const { ContactMessage } = require('../models')

async function createContactMessage(req, res) {
  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, ['POST'])
  }

  const schema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    message: z.string().min(10).max(3000)
  })
  const parsed = schema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ error: 'Please provide a valid name, email, and message' })
  }

  await connectDb()
  await ContactMessage.create(parsed.data)
  return res.status(201).json({ ok: true })
}

module.exports = { createContactMessage }
