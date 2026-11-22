import { ZodError } from 'zod'

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

// Express 4 doesn't catch rejected promises, so wrap every async handler.
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

const send = (res, status, message, extra = {}) => res.status(status).json({ error: { message, ...extra } })

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
    const first = issues[0]
    return send(res, 400, first ? (first.path ? `${first.path}: ${first.message}` : first.message) : 'Invalid input', { issues })
  }
  if (err instanceof HttpError) return send(res, err.status, err.message)
  if (err?.type === 'entity.parse.failed') return send(res, 400, 'Malformed JSON')
  if (err?.type === 'entity.too.large') return send(res, 413, 'Request too large')
  if (err?.code === 11000) return send(res, 409, 'Already exists')
  console.error(err)
  return send(res, 500, 'Something went wrong')
}
