const { createContactMessage } = require('../../src/controllers/contactController')
const { withController } = require('../../src/lib/http')

module.exports = withController(createContactMessage)
