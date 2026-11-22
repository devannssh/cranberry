import { useState, useCallback, useEffect } from 'react'
import { loadEntries, saveEntry, patchEntry, deleteEntry, migrateLocal } from '../lib/storage.js'
export const MOODS = ['sun', 'calm', 'flux', 'low', 'spark']
const put = (list, e) => [...list.filter(x => x.id !== e.id && x.date !== e.date), e].sort((a, b) => a.date.localeCompare(b.date))
export default function useEntries() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [undo, setUndo] = useState(null) // last deleted entry, powers the toast
  useEffect(() => {
    let live = true
    migrateLocal().then(loadEntries).then(l => live && setEntries(l)).catch(e => live && setError(e.message)).finally(() => live && setLoading(false))
    return () => { live = false }
  }, [])
  // Resolves true once the server has it, so the composer can stay open (keeping the text) if the save fails.
  const save = useCallback(async ({ text, mood, tag, bg, date }) => {
    try { const saved = await saveEntry({ date, text, mood, bg, tag }); setEntries(l => put(l, saved)); return true }
    catch (e) { setError(e.message); return false }
  }, [])
  const update = useCallback(async (e, patch) => { // optimistic, rolls back on failure
    setEntries(l => l.map(x => x.id === e.id ? { ...x, ...patch } : x))
    try { const saved = await patchEntry(e.id, patch); setEntries(l => l.map(x => x.id === e.id ? saved : x)) }
    catch (err) { setEntries(l => l.map(x => x.id === e.id ? e : x)); setError(err.message) }
  }, [])
  const remove = useCallback(async (entry) => {
    setEntries(l => l.filter(x => x.id !== entry.id)); setUndo(entry)
    try { await deleteEntry(entry.id) }
    catch (err) { setEntries(l => put(l, entry)); setUndo(null); setError(err.message) }
  }, [])
  const restore = useCallback(async () => {
    const u = undo; if (!u) return; setUndo(null)
    try { const saved = await saveEntry(u); setEntries(l => put(l, saved)) } catch (err) { setError(err.message) }
  }, [undo])
  return { entries, loading, error, clearError: useCallback(() => setError(null), []), save, update, remove, restore, undo, dismissUndo: useCallback(() => setUndo(null), []) }
}
export function streak(entries) {
  const set = new Set(entries.map(e => e.date)); let n = 0; const d = new Date()
  const iso = (x) => `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`
  if (!set.has(iso(d))) d.setDate(d.getDate() - 1)
  while (set.has(iso(d))) { n++; d.setDate(d.getDate() - 1) }
  return n
}
