const bool = (v, fallback) => (v === undefined || v === '' ? fallback : /^(1|true|yes)$/i.test(v))

const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be set to at least 32 characters (see .env.example)')
}

export const config = {
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/daily',
  jwtSecret,
  cookieName: 'cranberry_token',
  tokenDays: 30,
  allowRegistration: bool(process.env.ALLOW_REGISTRATION, true),
  trustProxy: Number(process.env.TRUST_PROXY) || false,
}
