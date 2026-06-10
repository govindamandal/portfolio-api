function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not configured`)
  }
  return value
}

module.exports = { requireEnv }
