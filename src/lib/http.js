function getAllowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,https://govindamandal.github.io')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

function applyCors(req, res) {
  const origin = req.headers.origin
  const allowedOrigins = getAllowedOrigins()

  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || allowedOrigins[0] || '*')
  }

  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }

  return false
}

function sendMethodNotAllowed(res, methods) {
  res.setHeader('Allow', methods.join(', '))
  res.status(405).json({ error: 'Method not allowed' })
}

function withController(controller) {
  return async function handler(req, res) {
    try {
      if (applyCors(req, res)) {
        return
      }

      await controller(req, res)
    } catch (error) {
      console.error(error)
      res.status(error.statusCode || 500).json({ error: error.publicMessage || 'Something went wrong' })
    }
  }
}

function serialize(document) {
  if (!document) {
    return null
  }

  const value = typeof document.toObject === 'function'
    ? document.toObject({ virtuals: true })
    : document

  return {
    ...value,
    _id: value._id?.toString()
  }
}

module.exports = { sendMethodNotAllowed, serialize, withController }
