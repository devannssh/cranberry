import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import MoodBars from './MoodBars.jsx'
import { todayISO } from '../lib/storage.js'
import { calm } from '../lib/fx.js'
const WD = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const slide = (root, x, deps) => { // panels slide in from their own side
  if (calm()) return
  const ctx = gsap.context(() => {
    gsap.from('.tile', { x, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out', clearProps: 'transform,opacity' })
    gsap.from('.mc:not(.blank)', { scale: 0, duration: 0.3, stagger: 0.012, delay: 0.2, ease: 'back.out(2.4)', clearProps: 'transform' })
  }, root)
  return () => ctx.revert()
}
// Left of an open folder (wide screens): the month as a calendar. Written days are orange; click one to jump to its card.
export function MonthPanel({ y, m, entries, onJump }) {
  const root = useRef(null), pre = `${y}-${String(m + 1).padStart(2, '0')}`, today = todayISO()
  const dim = new Date(y, m + 1, 0).getDate(), lead = (new Date(y, m, 1).getDay() + 6) % 7
  const by = new Map(entries.map(e => [e.date, e]))
  const words = entries.reduce((s, e) => s + e.text.trim().split(/\s+/).length, 0)
  const avg = entries.length ? Math.round(entries.reduce((s, e) => s + e.text.length, 0) / entries.length) : 0
  useEffect(() => slide(root.current, -34), [pre])
  return (
    <div className="side-in" ref={root}>
      <section className="tile">
        <header className="tl mono tiny"><span>THIS MONTH</span><span>{entries.length} / {dim}</span></header>
        <div className="cal7">
          {WD.map((d, i) => <span key={i} className="wd mono tiny">{d}</span>)}
          {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} className="mc blank" />)}
          {Array.from({ length: dim }, (_, i) => {
            const d = i + 1, date = `${pre}-${String(d).padStart(2, '0')}`, e = by.get(date), cls = 'mc' + (e ? ' on' : '') + (date === today ? ' now' : '')
            return e ? <button key={d} className={cls} title={e.text} onClick={() => onJump(date)}>{d}</button> : <span key={d} className={cls}>{d}</span>
          })}
        </div>
      </section>
      <section className="tile">
        <div className="trio">
          <div><b>{entries.length}</b><span className="mono tiny">entries</span></div>
          <div><b>{words}</b><span className="mono tiny">words</span></div>
          <div><b>{avg}</b><span className="mono tiny">avg chars</span></div>
        </div>
      </section>
    </div>)
}
// Right of an open folder: mood mix, tags, and the longest line of the month.
export function Highlights({ entries, pre }) {
  const root = useRef(null)
  const longest = entries.reduce((b, e) => (!b || e.text.length > b.text.length ? e : b), null)
  const counts = {}; entries.forEach(e => { if (e.tag) counts[e.tag] = (counts[e.tag] || 0) + 1 })
  const tags = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
  useEffect(() => slide(root.current, 34), [pre])
  return (
    <div className="side-in" ref={root}>
      <section className="tile">
        <header className="tl mono tiny"><span>MOODS</span><span>THIS MONTH</span></header>
        <MoodBars entries={entries} />
      </section>
      <section className="tile m">
        <header className="tl mono tiny"><span>TAGS</span><span /></header>
        {tags.length ? <div className="tagcloud">{tags.map(([t, n]) => <span className="tagc mono" key={t}>#{t} <b>{n}</b></span>)}</div>
          : <p className="t-line dim">No tags yet. Add a #tag when you write.</p>}
      </section>
      {longest && (
        <section className="tile">
          <header className="tl mono tiny"><span>LONGEST LINE</span><span>{longest.date.slice(5)}</span></header>
          <p className="quote">{longest.text}</p>
        </section>)}
    </div>)
}
