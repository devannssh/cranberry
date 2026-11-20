import { streak } from '../hooks/useEntries.js'
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
// Bento-style face for one month: title tile, metal chip, hatched block, orange count tile, info tile with a day-dot calendar.
export default function FolderFace({ entries, year, month, daysInMonth, isCurrent }) {
  const pre = `${year}-${String(month + 1).padStart(2, '0')}`
  const mo = entries.filter(e => e.date.startsWith(pre)), days = new Set(mo.map(e => +e.date.slice(8)))
  return (
    <div className="face">
      <div className="t1"><h1>{MON[month]}<i>.</i></h1><span className="mono tiny">ID: JRN-{pre}</span></div>
      <div className="chip" aria-hidden="true" />
      <div className="t2"><div className="hatch" /><div className="count"><b>{String(mo.length).padStart(2, '0')}</b><span className="mono tiny">entries</span></div></div>
      <div className="t3">
        <span className="mono tiny">client: ME</span>
        <div><h2>Daily entries</h2><p className="mono tiny">{mo.length} / {daysInMonth} days{isCurrent ? ` / streak ${streak(entries)}d` : ''}</p>
          <div className="cal" role="img" aria-label={`${mo.length} of ${daysInMonth} days written`}>
            {Array.from({ length: daysInMonth }, (_, i) => <i key={i} className={days.has(i + 1) ? 'on' : ''} />)}
          </div></div>
      </div>
    </div>)
}
