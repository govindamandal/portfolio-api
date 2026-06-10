const { adminCollection } = require('../../../../src/controllers/contentController')
const { withController } = require('../../../../src/lib/http')

module.exports = withController(adminCollection)
