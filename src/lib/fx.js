// Shared GSAP effects. Everything here is skipped under prefers-reduced-motion, and the touch-only ones also skip on phones.
import { useEffect } from 'react'
import { gsap } from 'gsap'
import { tick } from './tick.js'

export const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches
export const fine = () => matchMedia('(pointer: fine)').matches
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/<>_'

// Decode: the text starts as noise and resolves left to right. `el` must have a single text child (React renders it that way
// when you pass it one template string), so React and this can both update it safely.
export function scramble(el, text, { duration = 0.7, delay = 0 } = {}) {
  if (!el) return null
  if (calm()) { el.textContent = text; return null }
  const o = { p: 0 }
  return gsap.to(o, {
    p: 1, duration, delay, ease: 'none',
    onUpdate() {
      const n = Math.floor(o.p * text.length)
      let s = text.slice(0, n)
      for (let i = n; i < text.length; i++) s += text[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0]
      el.textContent = s
    },
    onComplete() { el.textContent = text },
  })
}

export function countUp(el, to, { duration = 0.8, delay = 0, pad = 2 } = {}) {
  if (!el) return null
  const fmt = (v) => String(Math.round(v)).padStart(pad, '0')
  if (calm() || !to) { el.textContent = fmt(to); return null }
  const o = { v: 0 }; el.textContent = fmt(0)
  return gsap.to(o, { v: to, duration, delay, ease: 'power3.out', onUpdate: () => { el.textContent = fmt(o.v) } })
}

// The element leans toward the cursor and springs back when it leaves.
export function useMagnetic(ref, strength = 0.3) {
  useEffect(() => {
    const el = ref.current
    if (!el || calm() || !fine()) return
    const qx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.5)' }), qy = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.5)' })
    const mv = (e) => { const r = el.getBoundingClientRect(); qx((e.clientX - (r.left + r.width / 2)) * strength); qy((e.clientY - (r.top + r.height / 2)) * strength) }
    const lv = () => { qx(0); qy(0) }
    el.addEventListener('pointermove', mv); el.addEventListener('pointerleave', lv)
    return () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerleave', lv); gsap.set(el, { x: 0, y: 0 }) }
  }, [])
}

const BITS = ['circle(50%)', 'polygon(50% 0,100% 100%,0 100%)', 'inset(0)', 'polygon(0 0,100% 100%,0 100%)'] // the mood glyphs: circle, triangle, square, wedge
const BIT_COLORS = ['#F25004', '#111', '#F25004', '#BFE3CF', '#D8D2C4']
// A date stamp slams onto the screen when an entry is saved, with a shockwave and a burst of glyph confetti. Pure DOM, removes itself.
export function stamp({ date, streak = 0 }) {
  if (calm()) return
  const d = new Date(`${date}T00:00:00`)
  const layer = document.createElement('div'); layer.className = 'fx-layer'; layer.setAttribute('aria-hidden', 'true')
  const el = document.createElement('div'); el.className = 'fx-stamp mono'
  el.innerHTML = `<small>LOGGED</small><b>${d.getDate()}</b><small>${MON[d.getMonth()]} ${d.getFullYear()}</small>${streak > 1 ? `<small class="hot">${streak} DAY STREAK</small>` : ''}`
  const ring = document.createElement('i'); ring.className = 'fx-ring'
  layer.append(ring, el)
  const bits = Array.from({ length: 24 }, () => {
    const i = document.createElement('i'), s = 8 + Math.random() * 12
    i.className = 'fx-bit'
    i.style.cssText = `width:${s}px;height:${s}px;margin:${-s / 2}px 0 0 ${-s / 2}px;background:${BIT_COLORS[(Math.random() * BIT_COLORS.length) | 0]};clip-path:${BITS[(Math.random() * BITS.length) | 0]}`
    layer.appendChild(i); return i
  })
  document.body.appendChild(layer)
  const tl = gsap.timeline({ onComplete: () => layer.remove() })
  tl.set(bits, { scale: 0 })
    .fromTo(el, { scale: 2.8, rotate: -28, opacity: 0 }, { scale: 1, rotate: -8, opacity: 1, duration: 0.26, ease: 'power4.in' })
    .add(() => tick(0.12))
    .fromTo(ring, { scale: 0.8, opacity: 0.9 }, { scale: 2.6, opacity: 0, duration: 0.6, ease: 'power2.out' }, '<')
    .to(el, { rotate: -5, duration: 0.5, ease: 'elastic.out(1, 0.3)' }, '<')
    .to(bits, { x: 'random(-240,240)', y: 'random(-280,-60)', rotate: 'random(-400,400)', scale: 1, duration: 0.5, ease: 'power3.out' }, '<')
    .to(bits, { y: '+=340', opacity: 0, duration: 1, ease: 'power2.in', stagger: 0.012 }, '>-0.05')
    .to(el, { opacity: 0, y: -14, duration: 0.35, ease: 'power2.in' }, '-=0.6')
}
