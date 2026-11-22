import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { calm, fine } from '../lib/fx.js'
// A huge outlined "cranberry." closing the home page. The letters rise in when it scrolls into view, then lift and fill with orange
// as the cursor passes under them.
export default function FooterMark({ username }) {
  const root = useRef(null)
  useEffect(() => {
    if (calm()) return
    const el = root.current, L = [...el.querySelectorAll('.fm i')]
    gsap.set(L, { yPercent: 115 })
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { gsap.to(L, { yPercent: 0, duration: 0.9, stagger: 0.05, ease: 'expo.out' }); io.disconnect() } }, { threshold: 0.25 })
    io.observe(el)
    let mv, lv
    if (fine()) {
      const qy = L.map(l => gsap.quickTo(l, 'y', { duration: 0.5, ease: 'power3.out' }))
      mv = (e) => L.forEach((l, i) => {
        const r = l.getBoundingClientRect(), p = Math.max(0, 1 - Math.abs(e.clientX - (r.left + r.width / 2)) / (r.width * 1.6))
        const near = Math.abs(e.clientY - (r.top + r.height / 2)) < r.height * 1.4 ? p : 0
        l.style.setProperty('--p', near.toFixed(2)); qy[i](-near * 36)
      })
      lv = () => L.forEach((l, i) => { l.style.setProperty('--p', 0); qy[i](0) })
      el.addEventListener('pointermove', mv); el.addEventListener('pointerleave', lv)
    }
    return () => { io.disconnect(); if (mv) { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerleave', lv) }; gsap.set(L, { clearProps: 'all' }) }
  }, [])
  return (
    <footer className="foot" ref={root}>
      <div className="fm" aria-label="cranberry">{[...'cranberry.'].map((c, i) => <i key={i} aria-hidden="true" className={c === '.' ? 'dot' : ''}>{c}</i>)}</div>
      <div className="foot-meta mono tiny"><span>ONE TRUE LINE A DAY</span><span>160 CHARACTERS, NO MORE</span><span>{`@${username}`}</span></div>
    </footer>)
}
