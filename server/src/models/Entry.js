import mongoose from 'mongoose'

// Keep these in sync with src/hooks/useEntries.js (MOODS) and src/lib/themes.js (card colours) in the frontend.
export const MOODS = ['sun', 'calm', 'flux', 'low', 'spark']
export const BGS = ['paper', 'orange', 'ink', 'white', 'sand', 'mint']

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // local calendar day, YYYY-MM-DD
    text: { type: String, required: true, trim: true, minlength: 1, maxlength: 160 },
    mood: { type: String, required: true, enum: MOODS },
    bg: { type: String, enum: BGS, default: 'paper' },
    tag: { type: String, trim: true, maxlength: 16 },
  },
  { timestamps: true },
)

// One entry per user per day. This index is what makes PUT /entries/:date an atomic upsert.
schema.index({ user: 1, date: 1 }, { unique: true })

// Shape the frontend expects (id, date, text, mood, tag?, bg, createdAt).
export const serialize = (e) => ({
  id: String(e._id),
  date: e.date,
  text: e.text,
  mood: e.mood,
  bg: e.bg,
  ...(e.tag ? { tag: e.tag } : {}),
  createdAt: e.createdAt,
  updatedAt: e.updatedAt,
})

export default mongoose.model('Entry', schema)
