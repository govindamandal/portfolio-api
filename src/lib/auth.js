const bcrypt = require('bcryptjs')
const cookie = require('cookie')
const jwt = require('jsonwebtoken')
const { requireEnv } = require('./env')
const { User } = require('../models')

const cookieName = process.env.ADMIN_COOKIE_NAME || 'portfolio_admin_token'

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role },
    requireEnv('JWT_SECRET'),
    { expiresIn: '7d' }
  )
}

function setAuthCookie(res, token) {
  res.setHeader('Set-Cookie', cookie.serialize(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  }))
}

function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', cookie.serialize(cookieName, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 0
  }))
}

function getToken(req) {
  const authHeader = req.headers.authorization || ''
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  const parsedCookies = cookie.parse(req.headers.cookie || '')
  return parsedCookies[cookieName]
}

async function requireAdmin(req) {
  const token = getToken(req)
  if (!token) {
    const error = new Error('Authentication required')
    error.statusCode = 401
    error.publicMessage = 'Authentication required'
    throw error
  }

  try {
    const payload = jwt.verify(token, requireEnv('JWT_SECRET'))
    if (payload.role !== 'admin') {
      const error = new Error('Admin access required')
      error.statusCode = 403
      error.publicMessage = 'Admin access required'
      throw error
    }
    return payload
  } catch (error) {
    error.statusCode = error.statusCode || 401
    error.publicMessage = error.publicMessage || 'Invalid or expired session'
    throw error
  }
}

async function verifyAdminCredentials(email, password) {
  const user = await User.findOne({
    email: email.toLowerCase(),
    role: 'admin',
    isActive: { $ne: false }
  })

  if (!user || !user.passwordHash) {
    return null
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash)
  return passwordMatches ? user : null
}

module.exports = {
  clearAuthCookie,
  requireAdmin,
  setAuthCookie,
  signToken,
  verifyAdminCredentials
}
