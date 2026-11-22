import { z } from 'zod'
import { MOODS, BGS } from './models/Entry.js'

const isRealDate = (s) => {
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}
// The client sends its own local date, which can be up to a day ahead of UTC.
const latestAllowed = () => new Date(Date.now() + 864e5).toISOString().slice(0, 10)

export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .refine(isRealDate, 'Not a real date')
  .refine((s) => s >= '2000-01-01' && s <= latestAllowed(), 'Date out of range')

const text = z.string().trim().min(1, 'Write something').max(160, '160 characters max')
const tag = z.string().trim().max(16, '16 characters max').regex(/^[^#\s]*$/, 'No spaces or #')

export const entryBody = z.object({
  text,
  mood: z.enum(MOODS),
  bg: z.enum(BGS).default('paper'),
  tag: tag.optional(), // '' or missing = no tag
})

export const entryPatch = z
  .object({
    text: text.optional(),
    mood: z.enum(MOODS).optional(),
    bg: z.enum(BGS).optional(),
    tag: tag.nullable().optional(), // null or '' clears it
  })
  .refine((o) => Object.keys(o).length > 0, 'Nothing to update')

export const importEntry = entryBody.extend({ date: dateString })
export const importBody = z.object({ entries: z.array(z.unknown()).max(2000) })

export const credentials = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8, 'At least 8 characters').max(72, '72 characters max'), // bcrypt ignores bytes past 72
})

const RESERVED = new Set(['admin', 'administrator', 'root', 'system', 'support', 'help', 'api', 'me', 'you', 'daily', 'cranberry', 'user', 'username', 'null', 'undefined', 'anonymous', 'staff', 'mod', 'moderator', 'official'])
export const AVATARS = 8 // keep in sync with src/components/Avatar.jsx

export const username = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,20}$/, '3-20 letters, numbers or _')
  .refine((u) => !RESERVED.has(u), 'That name is reserved')

export const profilePatch = z
  .object({
    username: username.optional(),
    avatar: z.number().int().min(0).max(AVATARS - 1).optional(),
    profileStyle: z.enum(['light', 'gradient']).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, 'Nothing to update')
