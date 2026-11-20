import { useState, useCallback } from 'react'
import { loadEntries, saveEntry, deleteEntry, todayISO } from '../lib/storage.js'
export const MOODS = ['sun', 'calm', 'flux', 'low', 'spark']
export default function useEntries() {
  const [entries, setEntries] = useState(loadEntries)
  const [undo, setUndo] = useState(null) // last deleted entry, powers the toast
  const save = useCallback(({ text, mood, tag, bg, date = todayISO(), id }) => {
    setEntries(saveEntry({ id: id || crypto.randomUUID(), date, text, mood, bg, tag: tag || undefined, createdAt: new Date().toISOString() }))
  }, [])
  const update = useCallback((e, patch) => setEntries(saveEntry({ ...e, ...patch })), [])
  const remove = useCallback((entry) => { setEntries(deleteEntry(entry.id)); setUndo(entry) }, [])
  const restore = useCallback(() => { if (undo) setEntries(saveEntry(undo)); setUndo(null) }, [undo])
  return { entries, save, update, remove, restore, undo, dismissUndo: useCallback(() => setUndo(null), []) }
}
export function streak(entries) {
  const set = new Set(entries.map(e => e.date)); let n = 0; const d = new Date()
  const iso = (x) => `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`
  if (!set.has(iso(d))) d.setDate(d.getDate() - 1)
  while (set.has(iso(d))) { n++; d.setDate(d.getDate() - 1) }
  return n
}
