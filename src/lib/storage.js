// Data layer: every call goes to the Express/MongoDB server (see /server). Same function names as the old localStorage version.
import { api } from './api.js'
const LEGACY_KEY = 'journal.entries.v2', MIGRATED_KEY = 'journal.migrated.v1'
export const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
export const loadEntries = async () => (await api('/entries')).entries
// One entry per day: saving an existing date replaces it.
export const saveEntry = async ({ date, text, mood, bg, tag }) => (await api(`/entries/${date}`, { method: 'PUT', body: { text, mood, bg, tag } })).entry
export const patchEntry = async (id, patch) => (await api(`/entries/${id}`, { method: 'PATCH', body: patch })).entry
export const deleteEntry = (id) => api(`/entries/${id}`, { method: 'DELETE' })
// One-time: copy entries written before the backend existed (browser localStorage) into the signed-in account.
// Sample entries (id "seed-…") are skipped; days that already have an entry on the server are never overwritten.
export async function migrateLocal() {
  try {
    if (localStorage.getItem(MIGRATED_KEY)) return
    const mine = (JSON.parse(localStorage.getItem(LEGACY_KEY) || '[]')).filter(e => e && !String(e.id).startsWith('seed-'))
    if (mine.length) await api('/entries/import', { method: 'POST', body: { entries: mine.map(({ date, text, mood, bg, tag }) => ({ date, text, mood, bg, tag })) } })
    localStorage.setItem(MIGRATED_KEY, '1')
  } catch { /* try again next load */ }
}
