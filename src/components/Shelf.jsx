import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Folder from './Folder.jsx'
import { tickRun, speedFromVelocity } from '../lib/tick.js'
const FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']

// ── how the shelf feels (tweak these) ───────────────────────────────────────────────────────────
const GLIDE_MS = 560  // one wheel / arrow-key / dot step. Longer = heavier
const DRAG_LAG = 60   // ms the shelf trails behind your cursor while you drag it. 0 = glued to the cursor
const COAST_MS = 450  // how far a released drag keeps travelling (friction) before it settles on a folder
const ease = (t) => 1 - (1 - t) ** 3
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches

// Sideways row of month folders. Move it by: touch swipe / trackpad (native), mouse drag (click & drag, with a little
// weight and friction), mouse wheel, ←/→, or the month dots underneath. Every folder that passes the centre ticks.
export default function Shelf({ entries, months, picked, focus, onPick }) {
  const ref = useRef(null), api = useRef({}), pickedRef = useRef(picked), now = new Date()
  pickedRef.current = picked
  const [cur, setCur] = useState(() => { const f = months.findIndex(x => `${x.y}-${x.m}` === focus); return f < 0 ? months.length - 1 : f })

  useLayoutEffect(() => { // start centred on the folder we came from (or the newest month) — before first paint, so nothing jumps
    const el = ref.current, c = el.children[cur]
    if (c) el.scrollLeft = c.offsetLeft - (el.clientWidth - c.offsetWidth) / 2
  }, [])

  useEffect(() => {
    const el = ref.current
    let raf = 0, goal = -1, drag = null, swallow = false, lastWheel = 0
    const count = () => el.children.length, maxX = () => Math.max(0, el.scrollWidth - el.clientWidth)
    const geo = () => { // all folders are the same width, so one pitch describes the whole row
      const a = el.children[0], b = el.children[1], pitch = b ? b.offsetLeft - a.offsetLeft : el.clientWidth
      return { pitch, at: (i) => a.offsetLeft + a.offsetWidth / 2 - el.clientWidth / 2 + i * pitch } // scrollLeft that centres folder i
    }
    const near = (x = el.scrollLeft) => { const g = geo(); return clamp(Math.round((x - g.at(0)) / g.pitch), 0, count() - 1) }

    // While we drive scrollLeft ourselves the CSS snap is switched off (class "moving"), otherwise the browser snaps every frame.
    const settle = () => { raf = 0; goal = -1; el.classList.remove('moving') }
    const stop = () => { cancelAnimationFrame(raf); settle() }
    const glide = (to, ms = GLIDE_MS) => {
      cancelAnimationFrame(raf); to = clamp(to, 0, maxX())
      const from = el.scrollLeft; el.classList.add('moving')
      if (calm() || Math.abs(to - from) < 1) { el.scrollLeft = to; settle(); return }
      const t0 = performance.now()
      const frame = (t) => { const k = clamp((t - t0) / ms, 0, 1); el.scrollLeft = from + (to - from) * ease(k); k < 1 ? (raf = requestAnimationFrame(frame)) : settle() }
      raf = requestAnimationFrame(frame)
    }
    const jump = (i, ms) => { i = clamp(i, 0, count() - 1); goal = i; glide(geo().at(i), ms) }
    const step = (d) => jump((goal < 0 ? near() : goal) + d) // rapid presses stack up on the pending target
    api.current.jump = (i) => jump(i, Math.min(900, GLIDE_MS + 70 * Math.abs(i - near())))

    // ticks + the active dot: one tick for every folder that crosses the centre, pitched by how fast the row is moving
    const mv = { x: el.scrollLeft, t: performance.now(), v: 0, i: near() }
    const onScroll = () => {
      const t = performance.now(), x = el.scrollLeft, dt = t - mv.t
      if (dt > 0) mv.v = mv.v * 0.4 + (Math.abs(x - mv.x) / dt) * 0.6 // px/ms, smoothed
      mv.x = x; mv.t = t
      const i = near()
      if (i !== mv.i) { tickRun(Math.abs(i - mv.i), speedFromVelocity(mv.v)); mv.i = i; setCur(i) }
    }

    const wheel = (e) => {
      if (pickedRef.current) return
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) { stop(); return } // already sideways (trackpad / shift+wheel): native scrolling
      e.preventDefault(); const n = Date.now(); if (n - lastWheel > 280) { lastWheel = n; step(Math.sign(e.deltaY)) }
    }
    const key = (e) => { if (pickedRef.current) return; if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1) }

    // Mouse drag (touch keeps its own native swipe + momentum). The shelf trails the cursor a little — that's the "drag" —
    // and on release keeps coasting, then settles on the folder it would have stopped at.
    const down = (e) => {
      stop()
      if (e.pointerType !== 'mouse' || e.button !== 0 || pickedRef.current) return
      drag = { id: e.pointerId, x0: e.clientX, s0: el.scrollLeft, pos: el.scrollLeft, to: el.scrollLeft, on: false, trail: [], t: 0, raf: 0 }
    }
    const follow = (t) => {
      if (!drag) return
      const lag = calm() ? 0 : DRAG_LAG, k = lag ? 1 - Math.exp(-(t - drag.t) / lag) : 1
      drag.t = t; drag.pos += (drag.to - drag.pos) * k; el.scrollLeft = drag.pos
      drag.raf = requestAnimationFrame(follow)
    }
    const move = (e) => {
      if (!drag || e.pointerId !== drag.id) return
      const dx = e.clientX - drag.x0
      if (!drag.on) { // a plain click must still open the folder, so only start dragging after 5px
        if (Math.abs(dx) < 5) return
        drag.on = true; el.setPointerCapture(e.pointerId); el.classList.add('moving', 'dragging'); drag.t = performance.now(); drag.raf = requestAnimationFrame(follow)
      }
      drag.to = clamp(drag.s0 - dx, 0, maxX())
      drag.trail.push([e.timeStamp, drag.to]); while (drag.trail.length > 2 && e.timeStamp - drag.trail[0][0] > 90) drag.trail.shift()
    }
    const up = (e) => {
      if (!drag || e.pointerId !== drag.id) return
      const d = drag; drag = null; cancelAnimationFrame(d.raf)
      if (!d.on) return
      el.classList.remove('dragging'); try { el.releasePointerCapture(e.pointerId) } catch { /* already released */ }
      swallow = true; setTimeout(() => { swallow = false }, 40) // the drag must not count as a click on the folder underneath
      const [t0, x0] = d.trail[0], [t1, x1] = d.trail[d.trail.length - 1]
      const v = e.timeStamp - t1 > 80 || t1 === t0 ? 0 : clamp((x1 - x0) / (t1 - t0), -3, 3) // px/ms at release
      const i = near(d.to + v * COAST_MS), dist = Math.abs(geo().at(i) - d.pos)
      jump(i, clamp(3 * dist / Math.max(Math.abs(v), 0.5), 380, 900))
    }
    const click = (e) => { if (swallow) { e.stopPropagation(); e.preventDefault() } }

    el.addEventListener('scroll', onScroll, { passive: true }); el.addEventListener('wheel', wheel, { passive: false })
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('click', click, true)
    addEventListener('keydown', key)
    return () => {
      stop(); if (drag) cancelAnimationFrame(drag.raf); el.classList.remove('dragging')
      el.removeEventListener('scroll', onScroll); el.removeEventListener('wheel', wheel)
      el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); el.removeEventListener('click', click, true)
      removeEventListener('keydown', key)
    }
  }, [])

  return (
    <>
      <div className="shelfwrap">
        <div className="shelf" ref={ref} aria-label="Month folders">
          {months.map(({ y, m }) => {
            const k = `${y}-${m}`, pre = `${y}-${String(m + 1).padStart(2, '0')}`
            return <Folder key={k} role={!picked ? 'rest' : picked === k ? 'picked' : 'other'} onPick={() => onPick(y, m)}
              label={`${FULL[m]} ${y}`} count={entries.filter(e => e.date.startsWith(pre)).length}
              entries={entries} year={y} month={m} daysInMonth={new Date(y, m + 1, 0).getDate()} isCurrent={y === now.getFullYear() && m === now.getMonth()} />
          })}
        </div>
      </div>
      <div className="dots" aria-label="Jump to month">{/* oldest on the left, newest on the right — same order as the shelf */}
        {months.map(({ y, m }, i) => <button key={`${y}-${m}`} className={'dot' + (i === cur ? ' on' : '')} disabled={!!picked}
          aria-label={`Go to ${FULL[m]} ${y}`} aria-current={i === cur} onClick={() => api.current.jump?.(i)} />)}
      </div>
    </>)
}
