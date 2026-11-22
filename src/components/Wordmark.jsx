import { useRef } from 'react'
import { gsap } from 'gsap'
import { calm } from '../lib/fx.js'
export function Berry({ size = 22 }) {
  return (
    <svg className="berry" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="18.5" r="9.5" fill="#F25004" stroke="#111" strokeWidth="2.2" />
      <path d="M16 9c0-3 1.5-5 4.5-6" stroke="#111" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M17 8.5c2-2.6 5-2.6 7-1.2-1.6 2.6-4.6 3-7 1.2z" fill="#BFE3CF" stroke="#111" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="12.6" cy="15.6" r="2.1" fill="#fff" opacity=".6" />
    </svg>)
}
// Navbar brand: berry tile + "cranberry." Click it: the letters hop in a wave and the berry bounces and rolls.
export default function Wordmark() {
  const ref = useRef(null)
  const hop = () => {
    if (calm()) return
    gsap.fromTo(ref.current.querySelectorAll('.wm-l i'), { y: 0 }, { y: -8, duration: 0.17, yoyo: true, repeat: 1, stagger: 0.04, ease: 'power2.out' })
    gsap.fromTo(ref.current.querySelector('.berry'), { y: 0, rotate: 0 }, { keyframes: [{ y: -10, rotate: -20, duration: 0.18 }, { y: 0, rotate: 360, duration: 0.6, ease: 'bounce.out' }] })
  }
  return (
    <button ref={ref} className="wm" aria-label="cranberry" onClick={hop}>
      <span className="wm-tile"><Berry size={24} /></span>
      <span className="wm-l">{[...'cranberry.'].map((c, i) => c === '.' ? <b key={i}>.</b> : <i key={i}>{c}</i>)}</span>
    </button>)
}
