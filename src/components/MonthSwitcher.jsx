const NAMES = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
export default function MonthSwitcher({ y, m, onShift, canPrev = true, canNext = true }) {
  return (
    <div className="switcher">
      <button className="round" aria-label="Previous month" disabled={!canPrev} onClick={() => onShift(-1)}>←</button>
      <span className="mono">month: <b>{NAMES[m]} {y}</b></span>
      <button className="round" aria-label="Next month" disabled={!canNext} onClick={() => onShift(1)}>→</button>
    </div>)
}
