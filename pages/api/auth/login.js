const { login } = require('../../../src/controllers/authController')
const { withController } = require('../../../src/lib/http')

module.exports = withController(login)
