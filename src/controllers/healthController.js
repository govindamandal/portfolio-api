const { sendMethodNotAllowed } = require('../lib/http')

async function health(req, res) {
  if (req.method !== 'GET') {
    return sendMethodNotAllowed(res, ['GET'])
  }

  return res.json({ ok: true, service: 'portfolio-api', framework: 'next.js' })
}

module.exports = { health }
