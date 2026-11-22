import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { streak } from '../hooks/useEntries.js'
import { useUser } from '../lib/user.js'
import { calm, fine, scramble, countUp } from '../lib/fx.js'
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
// Bento-style face for one month: title tile, metal chip, hatched block, orange count tile, info tile with a day-dot calendar.
// Alive: tiles assemble when the folder is built, "wake" (count-up, decoding labels, dot ripple, spinning chip) as it crosses the centre
// of the shelf, and float at different depths under the cursor with a glare.
export default function FolderFace({ entries, year, month, daysInMonth, isCurrent }) {
  const { user } = useUser()
  const name = user.username, root = useRef(null)
  const pre = `${year}-${String(month + 1).padStart(2, '0')}`
  const mo = entries.filter(e => e.date.startsWith(pre)), days = new Set(mo.map(e => +e.date.slice(8))), n = mo.length

  useEffect(() => {
    if (calm()) return
    const tw = gsap.from([...root.current.children], { scale: 0.7, opacity: 0, y: 16, duration: 0.55, ease: 'back.out(1.7)', stagger: 0.06, delay: 0.1, clearProps: 'all' })
    return () => tw.kill()
  }, [])

  useEffect(() => {
    const el = root.current, shelf = el.closest('.shelf')
    if (!shelf) return
    const q = (s) => el.querySelector(s), tw = []
    const wake = () => {
      if (calm()) return
      tw.forEach(t => t?.kill()); tw.length = 0
      tw.push(
        gsap.fromTo(el.querySelectorAll('.cal i'), { scale: 0.2 }, { scale: 1, duration: 0.45, ease: 'back.out(3)', stagger: 0.012 }),
        countUp(q('.count b'), n, { duration: 0.8 }),
        scramble(q('.t1 .tiny'), `ID: JRN-${pre}`),
        scramble(q('.t3 .tiny'), `client: ${name}`, { delay: 0.12 }),
        gsap.fromTo(q('.chip'), { '--a': '0deg' }, { '--a': '360deg', duration: 1.4, ease: 'power3.out' }))
    }
    // fires when the folder enters the middle band of the shelf (and once on mount if it starts there)
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) wake() }, { root: shelf, rootMargin: '0px -38% 0px -38%', threshold: 0 })
    io.observe(el)
    return () => { io.disconnect(); tw.forEach(t => t?.kill()) }
  }, [n, name, pre, daysInMonth])

  useEffect(() => {
    if (calm() || !fine()) return
    const el = root.current, flap = el.parentElement, depth = [5, 9, 4, 7]
    let fx = null
    const mv = (e) => {
      const r = flap.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5
      flap.style.setProperty('--gx', `${(nx + 0.5) * 100}%`); flap.style.setProperty('--gy', `${(ny + 0.5) * 100}%`)
      fx ??= [...el.children].map(t => ({ x: gsap.quickTo(t, 'x', { duration: 0.6, ease: 'power3.out' }), y: gsap.quickTo(t, 'y', { duration: 0.6, ease: 'power3.out' }) }))
      fx.forEach((f, i) => { f.x(nx * depth[i % 4] * 2); f.y(ny * depth[i % 4] * 2) })
    }
    const lv = () => fx?.forEach(f => { f.x(0); f.y(0) })
    flap.addEventListener('pointermove', mv); flap.addEventListener('pointerleave', lv)
    return () => { flap.removeEventListener('pointermove', mv); flap.removeEventListener('pointerleave', lv); gsap.set([...el.children], { x: 0, y: 0 }) }
  }, [])

  return (
    <div className="face" ref={root}>
      <div className="t1"><h1>{MON[month]}<i>.</i></h1><span className="mono tiny">{`ID: JRN-${pre}`}</span></div>
      <div className="chip" aria-hidden="true" />
      <div className="t2"><div className="hatch" /><div className="count"><b>{String(n).padStart(2, '0')}</b><span className="mono tiny">entries</span></div></div>
      <div className="t3">
        <span className="mono tiny">{`client: ${name}`}</span>
        <div><h2>Daily entries</h2><p className="mono tiny">{n} / {daysInMonth} days{isCurrent ? ` / streak ${streak(entries)}d` : ''}</p>
          <div className="cal" role="img" aria-label={`${n} of ${daysInMonth} days written`}>
            {Array.from({ length: daysInMonth }, (_, i) => <i key={i} className={days.has(i + 1) ? 'on' : ''} />)}
          </div></div>
      </div>
    </div>)
}
