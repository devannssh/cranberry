import mongoose from 'mongoose'
import { config } from './config.js'
import { createApp } from './app.js'
import User from './models/User.js'
import Entry from './models/Entry.js'

mongoose.set('strictQuery', true)
await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 8000 })
await Promise.all([User.init(), Entry.init()]) // make sure the unique indexes exist before taking traffic

const server = createApp().listen(config.port, () => console.log(`cranberry-server on http://localhost:${config.port}`))

const stop = async () => {
  server.close()
  await mongoose.disconnect()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
