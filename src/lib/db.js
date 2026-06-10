const mongoose = require('mongoose')
const { requireEnv } = require('./env')

let connectionPromise

async function connectDb() {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection
  }

  connectionPromise = connectionPromise || mongoose.connect(requireEnv('MONGODB_URI'), {
    dbName: process.env.MONGODB_DB || 'portfolio',
    bufferCommands: false
  })

  await connectionPromise
  return mongoose.connection
}

module.exports = { connectDb }
