const { me } = require('../../../src/controllers/authController')
const { withController } = require('../../../src/lib/http')

module.exports = withController(me)
