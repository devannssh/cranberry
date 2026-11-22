import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import Wordmark from './Wordmark.jsx'
import UserMenu from './UserMenu.jsx'
import { calm } from '../lib/fx.js'
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'], MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
// Sticky top bar: brand, streak and date chips, a sound toggle with a live equaliser, and the account menu.
export default function Nav({ streak, sound, onSound, onProfile, onLogout }) {
  const root = useRef(null), now = new Date()
  useEffect(() => {
    if (calm()) return
    const el = root.current
    const tw = gsap.from(el, { y: -36, opacity: 0, duration: 0.7, ease: 'back.out(1.6)', clearProps: 'transform,opacity' })
    const kids = gsap.from(el.querySelectorAll('.nav-in'), { y: -10, opacity: 0, stagger: 0.07, duration: 0.4, delay: 0.25, ease: 'power2.out', clearProps: 'transform,opacity' })
    return () => { tw.kill(); kids.kill() }
  }, [])
  useEffect(() => { // the bar gains a deeper shadow once the page scrolls under it
    const on = () => root.current?.classList.toggle('stuck', scrollY > 6)
    addEventListener('scroll', on, { passive: true }); return () => removeEventListener('scroll', on)
  }, [])
  return (
    <nav className="nav" ref={root} aria-label="Main">
      <span className="nav-in"><Wordmark /></span>
      <div className="nav-mid">
        <span className="chip nav-in" title="Days in a row">
          <span className="pips" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <i key={i} className={i < Math.min(streak, 7) ? 'on' : ''} />)}</span>
          {streak ? <><b>{streak}</b> DAY STREAK</> : 'START A STREAK'}
        </span>
        <span className="chip g nav-in">{DAYS[now.getDay()]} {now.getDate()} {MON[now.getMonth()]}</span>
      </div>
      <div className="nav-r">
        <button className="nbtn nav-in" aria-pressed={sound} title="Scroll sounds on / off" onClick={onSound}>
          <span className={'eq' + (sound ? ' on' : '')} aria-hidden="true"><i /><i /><i /><i /></span><span className="lbl">{sound ? 'SOUND ON' : 'SOUND OFF'}</span>
        </button>
        <span className="nav-in"><UserMenu onProfile={onProfile} onLogout={onLogout} /></span>
      </div>
    </nav>)
}
