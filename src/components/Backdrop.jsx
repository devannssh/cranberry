import { useEffect } from 'react'
import { gsap } from 'gsap'
import { calm, fine } from '../lib/fx.js'
// Floating mood-glyph shapes behind the sign-in, onboarding and profile screens, so the empty space around the card has life.
// Three layers per shape so the effects never fight: outer = cursor parallax, middle = slow drift, inner = pop-in.
const CLIP = ['circle(50%)', 'polygon(50% 0,100% 100%,0 100%)', 'inset(0)', 'polygon(0 0,100% 100%,0 100%)']
const COL = ['#F25004', '#111', '#BFE3CF', '#D8D2C4', '#F25004']
const r = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
const SHAPES = Array.from({ length: 16 }, (_, i) => ({ left: r(i) * 96, top: r(i + 40) * 92, size: 22 + r(i + 80) * 70, clip: CLIP[i % 4], color: COL[(i * 3) % 5], depth: 0.4 + r(i + 160) }))
export default function Backdrop() {
  useEffect(() => {
    if (calm()) return
    const ctx = gsap.context(() => {
      const outer = gsap.utils.toArray('.bd'), mid = gsap.utils.toArray('.bd-d'), inner = gsap.utils.toArray('.bd-d i')
      gsap.from(inner, { scale: 0, opacity: 0, duration: 0.8, stagger: 0.04, ease: 'back.out(1.8)' })
      mid.forEach((el, i) => {
        gsap.set(el, { rotate: gsap.utils.random(0, 360) })
        gsap.to(el, { y: gsap.utils.random(-26, 26), x: gsap.utils.random(-18, 18), rotate: `+=${gsap.utils.random(-50, 50)}`, duration: gsap.utils.random(3, 6), ease: 'sine.inOut', repeat: -1, yoyo: true, delay: i * 0.1 })
      })
      if (!fine()) return
      const qs = outer.map(el => [gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3.out' }), gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3.out' })])
      const mv = (e) => qs.forEach(([x, y], i) => { const d = SHAPES[i].depth * 46; x((0.5 - e.clientX / innerWidth) * d); y((0.5 - e.clientY / innerHeight) * d) })
      addEventListener('pointermove', mv)
      return () => removeEventListener('pointermove', mv)
    })
    return () => ctx.revert()
  }, [])
  return (
    <div className="backdrop" aria-hidden="true">
      {SHAPES.map((s, i) => (
        <div className="bd" key={i} style={{ left: `${s.left}%`, top: `${s.top}%` }}>
          <div className="bd-d"><i style={{ width: s.size, height: s.size, background: s.color, clipPath: s.clip }} /></div>
        </div>))}
    </div>)
}
