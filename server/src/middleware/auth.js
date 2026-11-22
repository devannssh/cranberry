import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { HttpError } from '../errors.js'

// Session lives in an httpOnly cookie, so page scripts never see the token.
const base = { httpOnly: true, sameSite: 'lax', secure: config.isProd, path: '/' }

export function issueToken(res, userId) {
  const token = jwt.sign({}, config.jwtSecret, { algorithm: 'HS256', subject: String(userId), expiresIn: `${config.tokenDays}d` })
  res.cookie(config.cookieName, token, { ...base, maxAge: config.tokenDays * 864e5 })
}

export const clearToken = (res) => res.clearCookie(config.cookieName, base)

export function requireAuth(req, _res, next) {
  const token = req.cookies?.[config.cookieName]
  if (!token) return next(new HttpError(401, 'Not signed in'))
  try {
    req.userId = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] }).sub
    next()
  } catch {
    next(new HttpError(401, 'Session expired, please sign in again'))
  }
}
