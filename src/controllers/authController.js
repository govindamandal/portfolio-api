const { z } = require('zod')
const { connectDb } = require('../lib/db')
const { sendMethodNotAllowed } = require('../lib/http')
const { clearAuthCookie, requireAdmin, setAuthCookie, signToken, verifyAdminCredentials } = require('../lib/auth')

async function login(req, res) {
  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, ['POST'])
  }

  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
  })
  const parsed = schema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ error: 'Valid email and password are required' })
  }

  await connectDb()
  const user = await verifyAdminCredentials(parsed.data.email, parsed.data.password)

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = signToken(user)
  setAuthCookie(res, token)
  return res.json({
    token,
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name || 'Admin'
    }
  })
}

async function logout(req, res) {
  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, ['POST'])
  }

  clearAuthCookie(res)
  return res.json({ ok: true })
}

async function me(req, res) {
  if (req.method !== 'GET') {
    return sendMethodNotAllowed(res, ['GET'])
  }

  const user = await requireAdmin(req)
  return res.json({ user })
}

module.exports = { login, logout, me }
