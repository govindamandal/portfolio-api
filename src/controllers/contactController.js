const { z } = require('zod')
const { connectDb } = require('../lib/db')
const { hasEmailJsConfig, sendContactEmail } = require('../lib/emailjs')
const { sendMethodNotAllowed } = require('../lib/http')
const { ContactMessage, Profile } = require('../models')

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
  const [message, profile] = await Promise.all([
    ContactMessage.create(parsed.data),
    Profile.findOne({
      $or: [
        { isPublic: { $exists: false } },
        { isPublic: true }
      ]
    })
  ])

  const toEmail = profile?.email

  if (!toEmail || !hasEmailJsConfig()) {
    return res.status(201).json({
      ok: true,
      emailSent: false,
      messageId: message._id.toString()
    })
  }

  await sendContactEmail({
    ...parsed.data,
    toEmail,
    toName: profile?.name
  })

  return res.status(201).json({
    ok: true,
    emailSent: true,
    messageId: message._id.toString()
  })
}

module.exports = { createContactMessage }
