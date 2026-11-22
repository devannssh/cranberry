import { useEffect, useRef } from 'react'
import { scramble } from '../lib/fx.js'
const NAMES = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
export default function MonthSwitcher({ y, m, onShift, canPrev = true, canNext = true }) {
  const label = useRef(null), first = useRef(true)
  useEffect(() => { // the month name decodes into place whenever it changes
    if (first.current) { first.current = false; return }
    const tw = scramble(label.current, `${NAMES[m]} ${y}`, { duration: 0.45 })
    return () => tw?.kill()
  }, [m, y])
  return (
    <div className="switcher">
      <button className="round" aria-label="Previous month" disabled={!canPrev} onClick={() => onShift(-1)}>←</button>
      <span className="mono">month: <b ref={label}>{`${NAMES[m]} ${y}`}</b></span>
      <button className="round" aria-label="Next month" disabled={!canNext} onClick={() => onShift(1)}>→</button>
    </div>)
}
