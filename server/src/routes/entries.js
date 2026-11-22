import { Router } from 'express'
import mongoose from 'mongoose'
import Entry, { serialize } from '../models/Entry.js'
import { dateString, entryBody, entryPatch, importBody, importEntry } from '../validation.js'
import { HttpError, asyncHandler } from '../errors.js'
import { requireAuth } from '../middleware/auth.js'

const r = Router()
r.use(requireAuth)

// Every query below is scoped by `user: req.userId`, so one account can never touch another's entries.
const objectId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, 'Entry not found')
  return id
}

// GET /api/entries            -> everything, oldest first (the shelf needs all months)
// GET /api/entries?month=YYYY-MM -> just that month
r.get('/', asyncHandler(async (req, res) => {
  const filter = { user: req.userId }
  const { month } = req.query
  if (month !== undefined) {
    if (typeof month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new HttpError(400, 'month must be YYYY-MM')
    filter.date = { $gte: `${month}-01`, $lte: `${month}-31` } // ISO dates sort as strings
  }
  const docs = await Entry.find(filter).sort({ date: 1 }).lean()
  res.json({ entries: docs.map(serialize) })
}))

// PUT /api/entries/2026-11-21 -> create the day's entry, or replace it if one exists
r.put('/:date', asyncHandler(async (req, res) => {
  const date = dateString.parse(req.params.date)
  const { text, mood, bg, tag } = entryBody.parse(req.body)
  const update = { $set: { text, mood, bg } }
  if (tag) update.$set.tag = tag
  else update.$unset = { tag: 1 }
  const doc = await Entry.findOneAndUpdate({ user: req.userId, date }, update, { upsert: true, new: true, runValidators: true })
  res.json({ entry: serialize(doc) })
}))

// PATCH /api/entries/:id -> change some fields (e.g. just the card colour). The date can't change.
r.patch('/:id', asyncHandler(async (req, res) => {
  const patch = entryPatch.parse(req.body)
  const update = {}
  for (const k of ['text', 'mood', 'bg']) if (patch[k] !== undefined) (update.$set ??= {})[k] = patch[k]
  if (patch.tag !== undefined) {
    if (patch.tag) (update.$set ??= {}).tag = patch.tag
    else update.$unset = { tag: 1 }
  }
  const doc = await Entry.findOneAndUpdate({ _id: objectId(req.params.id), user: req.userId }, update, { new: true, runValidators: true })
  if (!doc) throw new HttpError(404, 'Entry not found')
  res.json({ entry: serialize(doc) })
}))

r.delete('/:id', asyncHandler(async (req, res) => {
  const doc = await Entry.findOneAndDelete({ _id: objectId(req.params.id), user: req.userId })
  if (!doc) throw new HttpError(404, 'Entry not found')
  res.status(204).end()
}))

// POST /api/entries/import {entries:[{date,text,mood,bg?,tag?}]}
// Used once to move a browser's old localStorage diary into the account. Never overwrites a day that already has an entry;
// invalid rows and days that already exist are counted as skipped.
r.post('/import', asyncHandler(async (req, res) => {
  const { entries } = importBody.parse(req.body)
  const seen = new Set()
  const ops = []
  for (const raw of entries) {
    const p = importEntry.safeParse(raw)
    if (!p.success || seen.has(p.data.date)) continue
    seen.add(p.data.date)
    const { date, text, mood, bg, tag } = p.data
    ops.push({
      updateOne: {
        filter: { user: req.userId, date },
        update: { $setOnInsert: { text, mood, bg, ...(tag ? { tag } : {}) } },
        upsert: true,
      },
    })
  }
  const imported = ops.length ? (await Entry.bulkWrite(ops, { ordered: false })).upsertedCount : 0
  res.json({ imported, skipped: entries.length - imported })
}))

export default r
