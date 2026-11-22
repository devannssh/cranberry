import { Router } from 'express'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'
import { config } from '../config.js'
import User, { publicUser } from '../models/User.js'
import { credentials, username, profilePatch } from '../validation.js'
import { HttpError, asyncHandler } from '../errors.js'
import { issueToken, clearToken, requireAuth } from '../middleware/auth.js'

const r = Router()
const COST = 12
// Compared against when the email is unknown, so "no such user" takes as long as "wrong password".
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', COST)

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { message: 'Too many attempts, try again in a few minutes' } },
})

r.post('/register', limiter, asyncHandler(async (req, res) => {
  if (!config.allowRegistration) throw new HttpError(403, 'Registration is closed')
  const { email, password } = credentials.parse(req.body)
  const passwordHash = await bcrypt.hash(password, COST)
  let user
  try {
    user = await User.create({ email, passwordHash })
  } catch (e) {
    if (e.code === 11000) throw new HttpError(409, 'That email is already registered')
    throw e
  }
  issueToken(res, user.id)
  res.status(201).json({ user: publicUser(user) })
}))

r.post('/login', limiter, asyncHandler(async (req, res) => {
  const { email, password } = credentials.parse(req.body)
  const user = await User.findOne({ email })
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)
  if (!user || !ok) throw new HttpError(401, 'Wrong email or password')
  issueToken(res, user.id)
  res.json({ user: publicUser(user) })
}))

r.post('/logout', (_req, res) => {
  clearToken(res)
  res.status(204).end()
})

r.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId)
  if (!user) {
    clearToken(res)
    throw new HttpError(401, 'Account no longer exists')
  }
  res.json({ user: publicUser(user) })
}))

// Live "is this handle free?" check for the onboarding screen. Signed-in only, so it can't be used to scan for names anonymously.
const lookup = rateLimit({
  windowMs: 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { message: 'Slow down a little' } },
})

r.get('/username-available', requireAuth, lookup, asyncHandler(async (req, res) => {
  const p = username.safeParse(req.query.u)
  if (!p.success) return res.json({ available: false, reason: p.error.issues[0].message })
  const taken = await User.exists({ username: p.data, _id: { $ne: req.userId } })
  res.json({ available: !taken })
}))

// PATCH /api/auth/me {username?, avatar?, profileStyle?}. The unique index is the real authority on usernames
// (two people can pass the check above at the same moment), so a clash surfaces here as a 409.
r.patch('/me', requireAuth, asyncHandler(async (req, res) => {
  const patch = profilePatch.parse(req.body)
  let user
  try {
    user = await User.findByIdAndUpdate(req.userId, { $set: patch }, { new: true, runValidators: true })
  } catch (e) {
    if (e.code === 11000) throw new HttpError(409, 'That username is taken')
    throw e
  }
  if (!user) throw new HttpError(401, 'Account no longer exists')
  res.json({ user: publicUser(user) })
}))

export default r
