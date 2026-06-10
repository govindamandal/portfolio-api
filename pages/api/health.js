const { health } = require('../../src/controllers/healthController')
const { withController } = require('../../src/lib/http')

module.exports = withController(health)
