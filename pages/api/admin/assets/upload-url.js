const { createAssetUploadUrl } = require('../../../../src/controllers/assetController')
const { withController } = require('../../../../src/lib/http')

module.exports = withController(createAssetUploadUrl)
