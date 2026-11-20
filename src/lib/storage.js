// Storage helper: swap these three functions for API calls to add a backend.
const KEY = 'journal.entries.v2'
export const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
const T = ['Rain all day. Finished the book and cooked too much rice.','Shipped the prototype. Nobody noticed, which means it works.','Missed the train, found a better café. Net positive.','Slow morning. Tired in a way sleep does not fix.','Rewrote the same paragraph six times. Kept the first one.','Walked to the ghats at dusk. The river was the colour of tin.','Called home. Mum asked if I am eating. I am, mostly chai.','Fixed the bug by deleting the code. Best commit this month.','Cold hands, warm tea, good playlist. That is the whole day.','Bought a notebook I do not need. Used it immediately.','Long meeting that should have been two lines of text.','Ran before sunrise. The city belongs to dogs and bakers.','Said no to something. Felt lighter by evening.','Power cut at nine. Read by candle like an exam night.','Learned a new word: petrichor. Used it twice, unprompted.','Cleaned the desk. Found a pen from 2019 that still works.','Friend visited. We talked until the tea went cold twice.','Fog on the Sangam road. Everything looked unfinished, in a good way.','Small win: finished the thing I kept postponing.','Quiet day. Wrote this instead of scrolling.']
const M = ['calm','spark','sun','low','flux'], B = ['paper','orange','ink','white','sand','mint'], G = ['rain','work','luck','rest','writing','river','home','code','tea','shop']
const D = ['2026-10-28','2026-10-31', ...Array.from({ length: 18 }, (_, i) => `2026-11-${String(i + 3).padStart(2, '0')}`)]
const SEED = D.map((d, i) => ({ id: 'seed-' + d, date: d, text: T[i], mood: M[i % 5], tag: G[i % 10], bg: B[i % 6], createdAt: d + 'T20:00:00Z' }))
export function loadEntries() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
    localStorage.setItem(KEY, JSON.stringify(SEED)); return SEED
  } catch { return SEED }
}
const persist = (list) => { try { localStorage.setItem(KEY, JSON.stringify(list)) } catch {} return list }
// One entry per day: saving an existing date replaces it.
export function saveEntry(entry) {
  const list = loadEntries().filter(e => e.id !== entry.id && e.date !== entry.date)
  return persist([...list, entry].sort((a, b) => a.date.localeCompare(b.date)))
}
export const deleteEntry = (id) => persist(loadEntries().filter(e => e.id !== id))
