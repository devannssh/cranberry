import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import { config } from './config.js'
import authRoutes from './routes/auth.js'
import entryRoutes from './routes/entries.js'
import { HttpError, errorHandler } from './errors.js'

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist')

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  if (config.trustProxy) app.set('trust proxy', config.trustProxy)

  // Allows the Google Fonts the frontend loads and the inline styles framer-motion writes.
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        upgradeInsecureRequests: null,
      },
    },
  }))
  app.use(cookieParser())
  app.use('/api/entries/import', express.json({ limit: '1mb' })) // must come before the small default limit
  app.use(express.json({ limit: '16kb' }))
  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next() })

  app.get('/api/health', (_req, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1 }))
  app.use('/api/auth', authRoutes)
  app.use('/api/entries', entryRoutes)
  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Not found')))

  // After `npm run build` in the project root, this same server serves the frontend (one origin, no CORS needed).
  if (fs.existsSync(path.join(dist, 'index.html'))) {
    app.use(express.static(dist))
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
  }

  app.use(errorHandler)
  return app
}
