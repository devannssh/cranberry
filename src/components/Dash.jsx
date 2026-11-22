import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import Mag from './Mag.jsx'
import MoodBars from './MoodBars.jsx'
import { streak } from '../hooks/useEntries.js'
import { todayISO } from '../lib/storage.js'
import { calm, countUp, scramble } from '../lib/fx.js'
import PROMPTS from '../lib/prompts.js'
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
// Bento dashboard under the shelf: today, streak, a prompt, a 26-week heatmap, mood mix, and "on this day".
export default function Dash({ entries, onWrite, onOpen }) {
  const root = useRef(null), q = useRef(null)
  const now = new Date(), today = todayISO()
  const byDate = useMemo(() => new Map(entries.map(e => [e.date, e])), [entries])
  const todays = byDate.get(today), stk = streak(entries)
  const days14 = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (13 - i)); return iso(d) })
  const heat = useMemo(() => { // 26 weeks, Monday-first columns, ending with this week
    const end = new Date(), start = new Date(end)
    start.setDate(end.getDate() - ((end.getDay() + 6) % 7) - 25 * 7)
    return Array.from({ length: 26 * 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return { date: iso(d), future: d > end } })
  }, [])
  const written = heat.filter(c => byDate.has(c.date)).length
  const otd = useMemo(() => { // same date in an earlier year, else the same day of an earlier month
    const md = today.slice(5), dd = today.slice(8), [ty, tm] = today.split('-').map(Number)
    const old = entries.filter(e => e.date < today && (e.date.slice(5) === md || e.date.slice(8) === dd))
    return old.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2).map(e => {
      const [y, m] = e.date.split('-').map(Number), mo = (ty - y) * 12 + (tm - m)
      return { e, label: mo >= 12 ? `${Math.floor(mo / 12)} YR AGO` : `${mo} MO AGO` }
    })
  }, [entries])
  const [pi, setPi] = useState(Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5) % PROMPTS.length)
  const shuffle = () => { const n = (pi + 1) % PROMPTS.length; setPi(n); requestAnimationFrame(() => scramble(q.current, PROMPTS[n], { duration: 0.45 })) }
  const open = (d) => onOpen(+d.slice(0, 4), +d.slice(5, 7) - 1, d)

  useLayoutEffect(() => { // tiles rise in the first time the dashboard scrolls into view
    if (calm()) return
    const el = root.current, tiles = el.querySelectorAll('.tile')
    gsap.set(tiles, { opacity: 0, y: 40 })
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      gsap.timeline()
        .to(tiles, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out', clearProps: 'transform,opacity' })
        .from(el.querySelectorAll('.heat > *'), { scale: 0, duration: 0.3, stagger: 0.004, ease: 'back.out(2)', clearProps: 'transform' }, 0.2)
        .from(el.querySelectorAll('.dots14 i'), { scale: 0, duration: 0.3, stagger: 0.03, ease: 'back.out(3)', clearProps: 'transform' }, 0.3)
        .from(el.querySelectorAll('.mbar i'), { width: 0, duration: 0.7, stagger: 0.07, ease: 'power3.out', clearProps: 'width' }, 0.35)
      countUp(el.querySelector('.t-big'), stk, { duration: 0.9, delay: 0.3, pad: 1 })
    }, { threshold: 0.12 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section className="dash" ref={root} aria-label="Overview">
      <article className="tile o t-today">
        <header className="tl mono tiny"><span>01 / TODAY</span><span>{DAYS[now.getDay()]}</span></header>
        <div className="t-date">{now.getDate()}<i>.</i></div>
        <p className="mono tiny">{MONTHS[now.getMonth()]} {now.getFullYear()}</p>
        <p className={'t-line' + (todays ? '' : ' dim')}>{todays ? todays.text : 'Nothing written yet.'}</p>
        <Mag className="pill k" strength={0.25} onClick={onWrite}>{todays ? 'Edit today →' : 'Write today →'}</Mag>
      </article>

      <article className="tile h t-prompt">
        <header className="tl mono tiny"><span>02 / PROMPT</span><span>{pi + 1} / {PROMPTS.length}</span></header>
        <p className="t-q" ref={q}>{PROMPTS[pi]}</p>
        <div className="t-row"><Mag className="pill k" strength={0.25} onClick={onWrite}>Answer it →</Mag><button className="pill" onClick={shuffle} aria-label="Another prompt">↻ Shuffle</button></div>
      </article>

      <article className="tile k t-streak">
        <header className="tl mono tiny"><span>03 / STREAK</span><span>LAST 14 DAYS</span></header>
        <div className="t-big">{stk}</div>
        <p className="mono tiny">{stk === 1 ? 'DAY IN A ROW' : 'DAYS IN A ROW'}</p>
        <div className="dots14" aria-hidden="true">{days14.map(d => <i key={d} className={byDate.has(d) ? 'on' : ''} />)}</div>
      </article>

      <article className="tile t-heat">
        <header className="tl mono tiny"><span>04 / THE LAST 26 WEEKS</span><span>{written} DAYS WRITTEN</span></header>
        <div className="heat" role="img" aria-label={`${written} days written in the last 26 weeks`}>
          {heat.map(c => byDate.has(c.date)
            ? <button key={c.date} className={'on' + (c.date === today ? ' now' : '')} title={c.date} aria-label={`Open ${c.date}`} onClick={() => open(c.date)} />
            : <i key={c.date} title={c.date} className={(c.future ? 'fut' : '') + (c.date === today ? ' now' : '')} />)}
        </div>
      </article>

      <article className="tile t-moods">
        <header className="tl mono tiny"><span>05 / MOODS</span><span>ALL TIME</span></header>
        <MoodBars entries={entries} />
      </article>

      <article className="tile m t-otd">
        <header className="tl mono tiny"><span>06 / ON THIS DAY</span><span /></header>
        {otd.length ? otd.map(({ e, label }) => (
          <button key={e.id} className="otd" onClick={() => open(e.date)}><span className="mono tiny">{label} · {e.date}</span><p>{e.text}</p></button>))
          : <p className="t-line dim">Nothing from earlier yet. Keep writing: old days will resurface here.</p>}
      </article>
    </section>)
}
