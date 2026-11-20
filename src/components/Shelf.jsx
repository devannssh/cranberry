import { useEffect, useRef } from 'react'
import Folder from './Folder.jsx'
const FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']
// Sideways row of month folders: touch/trackpad scroll, mouse wheel and ←/→ move one folder at a time.
export default function Shelf({ entries, months, picked, focus, onPick }) {
  const ref = useRef(null), now = new Date()
  useEffect(() => { // start centred on the folder we came from (or the newest month)
    const el = ref.current, f = months.findIndex(x => `${x.y}-${x.m}` === focus), c = el.children[f < 0 ? months.length - 1 : f]
    if (c) el.scrollLeft = c.offsetLeft - (el.clientWidth - c.offsetWidth) / 2
  }, [])
  useEffect(() => {
    const el = ref.current, t = { v: 0 }
    const step = (d) => { const a = el.children[0], b = el.children[1]; el.scrollBy({ left: d * (b ? b.offsetLeft - a.offsetLeft : el.clientWidth), behavior: 'smooth' }) }
    const wheel = (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return // already sideways (trackpad / shift+wheel)
      e.preventDefault(); const n = Date.now(); if (n - t.v > 280) { t.v = n; step(Math.sign(e.deltaY)) }
    }
    const key = (e) => { if (picked) return; if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1) }
    el.addEventListener('wheel', wheel, { passive: false }); addEventListener('keydown', key)
    return () => { el.removeEventListener('wheel', wheel); removeEventListener('keydown', key) }
  }, [picked])
  return (
    <div className="shelf" ref={ref} aria-label="Month folders">
      {months.map(({ y, m }) => {
        const k = `${y}-${m}`, pre = `${y}-${String(m + 1).padStart(2, '0')}`
        return <Folder key={k} role={!picked ? 'rest' : picked === k ? 'picked' : 'other'} onPick={() => onPick(y, m)}
          label={`${FULL[m]} ${y}`} count={entries.filter(e => e.date.startsWith(pre)).length}
          entries={entries} year={y} month={m} daysInMonth={new Date(y, m + 1, 0).getDate()} isCurrent={y === now.getFullYear() && m === now.getMonth()} />
      })}
    </div>)
}
