const { normalizeAssetUrl } = require('./r2')

function normalizeAssetUrls(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeAssetUrls)
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, normalizeAssetUrls(entry)])
    )
  }

  if (typeof value === 'string') {
    return normalizeAssetUrl(value)
  }

  return value
}

module.exports = { normalizeAssetUrls }
