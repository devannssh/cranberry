import { useState, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import EntryCard from './EntryCard.jsx'
// Wallet-style stack: one card in front, others overlap above (newer) and below (older).
// Move with wheel, drag/swipe, ↑/↓ keys, or by clicking a peeking card.
export default function EntryStack({ entries, onEdit, onDelete, onColor, emptyText = 'No entries yet. Start today.' }) {
  const list = [...entries].sort((a, b) => b.date.localeCompare(a.date)), n = list.length
  const [a, setA] = useState(0), ref = useRef(null), acc = useRef(0), last = useRef(0)
  const go = (d) => setA(v => Math.max(0, Math.min(n - 1, v + d)))
  useEffect(() => { if (a > n - 1) setA(Math.max(0, n - 1)) }, [n])
  useEffect(() => {
    const el = ref.current; if (!el) return
    const w = (e) => { // only capture the wheel while the stack can still move
      const s = Math.sign(e.deltaY); if (!((s > 0 && a < n - 1) || (s < 0 && a > 0))) return
      e.preventDefault(); acc.current += e.deltaY; const t = Date.now()
      if (Math.abs(acc.current) > 50 && t - last.current > 110) { go(Math.sign(acc.current)); acc.current = 0; last.current = t }
    }
    const k = (e) => { if (/TEXTAREA|INPUT/.test(e.target.tagName)) return; if (e.key === 'ArrowDown') go(1); if (e.key === 'ArrowUp') go(-1) }
    el.addEventListener('wheel', w, { passive: false }); addEventListener('keydown', k)
    return () => { el.removeEventListener('wheel', w); removeEventListener('keydown', k) }
  }, [a, n])
  if (!n) return <div className="empty hatch mono">{emptyText}</div>
  return (
    <>
      <div className="wallet" ref={ref}>
        <AnimatePresence>
          {list.map((e, i) => <EntryCard key={e.id} entry={e} index={i} d={i - a} onSelect={() => setA(i)} onSwipe={go}
            onEdit={() => onEdit(e)} onDelete={() => onDelete(e)} onColor={onColor} />)}
        </AnimatePresence>
      </div>
      <div className="wnav">
        <div className="dots" aria-label="Jump to entry">{/* oldest on the left, newest on the right; tap to jump */}
          {list.map((e, i) => <button key={e.id} className={'dot' + (i === a ? ' on' : '')} aria-label={'Go to ' + e.date} aria-current={i === a} onClick={() => setA(i)} />).reverse()}
        </div>
        <p className="mono tiny">{String(a + 1).padStart(2, '0')} / {String(n).padStart(2, '0')} SCROLL / DRAG ↕</p>
      </div>
    </>)
}
