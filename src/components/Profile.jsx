import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import Avatar, { AVATARS } from './Avatar.jsx'
import { api } from '../lib/api.js'
import { useUser } from '../lib/user.js'
import { streak } from '../hooks/useEntries.js'
import { todayISO } from '../lib/storage.js'
import { calm, countUp } from '../lib/fx.js'
import Backdrop from './Backdrop.jsx'
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
// The gradient layer is the card's "banner" in the light state and grows to fill the whole card in the gradient state.
const GEO = {
  light: { top: '4.7%', left: '5.8%', width: '88.4%', height: '28.3%', borderRadius: '1.5em' },
  gradient: { top: '0%', left: '0%', width: '100%', height: '100%', borderRadius: '2em' },
}
function longest(entries) {
  let best = 0, run = 0, prev = null
  for (const d of [...new Set(entries.map(e => e.date))].sort()) {
    const t = Date.parse(`${d}T00:00:00Z`)
    run = prev !== null && t - prev === 864e5 ? run + 1 : 1; best = Math.max(best, run); prev = t
  }
  return best
}
const Glyph = ({ k }) => <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">{k === 'c' ? <circle cx="10" cy="10" r="9" /> : k === 't' ? <path d="M10 2L19 18H1Z" /> : <rect x="2" y="2" width="16" height="16" rx="2" />}</svg>

// Full-screen profile. Opens with an orange circle that grows out of the navbar button; the card can switch between two looks on demand.
export default function Profile({ origin, entries, onClose, onWrite }) {
  const { user, setUser } = useUser()
  const [style, setStyle] = useState(user.profileStyle === 'gradient' ? 'gradient' : 'light')
  const [tray, setTray] = useState(false), [msg, setMsg] = useState('')
  const root = useRef(null), orange = useRef(null), paper = useRef(null), card = useRef(null), bg = useRef(null), av = useRef(null)
  const tl = useRef(null), after = useRef(null)
  const wrote = entries.some(e => e.date === todayISO())
  const when = user.createdAt ? new Date(user.createdAt) : null
  const stats = [[entries.length, 'Entries', 'c'], [streak(entries), 'Streak', 't'], [longest(entries), 'Longest', 's']]

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(bg.current, GEO[style]) // GSAP owns the banner geometry from here on
      const R = Math.hypot(innerWidth, innerHeight) + 40, at = `${Math.round(origin.x)}px ${Math.round(origin.y)}px`
      const t = gsap.timeline({ paused: true })
      t.fromTo(orange.current, { clipPath: `circle(0px at ${at})` }, { clipPath: `circle(${R}px at ${at})`, duration: 0.75, ease: 'power3.inOut' }, 0)
        .fromTo(paper.current, { clipPath: `circle(0px at ${at})` }, { clipPath: `circle(${R}px at ${at})`, duration: 0.75, ease: 'power3.inOut' }, 0.16)
        .from(card.current, { y: -80, rotate: -6, opacity: 0, scale: 0.9, duration: 0.85, ease: 'back.out(1.6)' }, 0.6)
        .from('.pf-in', { y: 16, opacity: 0, duration: 0.45, stagger: 0.08, ease: 'power2.out' }, 0.7)
      t.eventCallback('onReverseComplete', () => { onClose(); after.current?.() })
      tl.current = t
      if (calm()) t.progress(1); else t.play()
      root.current.querySelectorAll('.pc-stat b').forEach((b, i) => countUp(b, +b.dataset.n, { delay: calm() ? 0 : 1.05 + i * 0.1, pad: 1 }))
    }, root)
    return () => ctx.revert()
  }, [])

  useEffect(() => { // the gradient is alive: each colour blob drifts, pulses and never quite repeats
    if (calm()) return
    const ctx = gsap.context(() => {
      const R = gsap.utils.random
      gsap.utils.toArray('.pc-bg i').forEach((b, i) => gsap.to(b, { xPercent: R(-35, 35), yPercent: R(-35, 35), scale: R(0.85, 1.3), duration: R(4, 7), ease: 'sine.inOut', repeat: -1, yoyo: true, delay: i * 0.3 }))
    }, root)
    return () => ctx.revert()
  }, [])

  useEffect(() => { if (tray && !calm()) gsap.from(root.current.querySelectorAll('.pf-tray button'), { scale: 0, rotate: -30, opacity: 0, stagger: 0.04, duration: 0.45, ease: 'back.out(2.4)', clearProps: 'transform,opacity' }) }, [tray])

  const close = (then) => {
    if (tl.current?.reversed()) return
    after.current = typeof then === 'function' ? then : null
    if (calm() || !tl.current) { onClose(); after.current?.(); return }
    tl.current.timeScale(1.5).reverse()
  }
  useEffect(() => { const k = (e) => { if (e.key === 'Escape') close() }; addEventListener('keydown', k); return () => removeEventListener('keydown', k) }, [])

  const save = async (patch) => { // optimistic: the UI changes now, and rolls back if the server says no
    const prev = user; setUser(u => ({ ...u, ...patch })); setMsg('')
    try { await api('/auth/me', { method: 'PATCH', body: patch }) } catch (e) { setUser(prev); setMsg(`Couldn't save: ${e.message}`) }
  }
  const pick = (next) => {
    if (next === style) return
    setStyle(next); save({ profileStyle: next })
    if (calm()) { gsap.set(bg.current, GEO[next]); return }
    gsap.to(bg.current, { ...GEO[next], duration: 1, ease: 'power4.inOut' })
    gsap.fromTo(card.current, { rotate: 0 }, { keyframes: [{ rotate: next === 'gradient' ? -1.6 : 1.6, duration: 0.18 }, { rotate: 0, duration: 0.9, ease: 'elastic.out(1,0.35)' }] })
    gsap.fromTo(av.current, { scale: 0.88 }, { scale: 1, duration: 0.8, ease: 'elastic.out(1,0.4)' })
  }
  const chooseAvatar = (i) => {
    if (i === user.avatar) return
    save({ avatar: i })
    if (!calm()) gsap.fromTo(av.current, { scale: 0.6, rotate: -14 }, { scale: 1, rotate: 0, duration: 0.7, ease: 'back.out(2.6)' })
  }

  return (
    <div className="pf" ref={root} role="dialog" aria-modal="true" aria-label="Profile">
      <div className="pf-orange" ref={orange} />
      <div className="pf-paper" ref={paper}>
        <Backdrop />
        <header className="pf-top mono tiny pf-in"><button className="back mono tiny" onClick={() => close()}>← Back</button><span>{`PROFILE / @${user.username}`}</span></header>
        <div className="seg pf-in" role="radiogroup" aria-label="Card style">
          <i className="seg-pill" style={{ transform: style === 'light' ? 'translateX(0)' : 'translateX(100%)' }} />
          <button className="mono tiny" role="radio" aria-checked={style === 'light'} onClick={() => pick('light')}>LIGHT</button>
          <button className="mono tiny" role="radio" aria-checked={style === 'gradient'} onClick={() => pick('gradient')}>GRADIENT</button>
        </div>
        <div className="pc" ref={card} data-style={style}>
          <div className="pc-bg" ref={bg}><i className="b1" /><i className="b2" /><i className="b3" /><i className="b4" /><i className="b5" /><span className="grain" /></div>
          <div className="pc-av" ref={av}><Avatar id={user.avatar} size="100%" /></div>
          <div className="pc-id"><h2>{user.username}</h2><p>{when ? `Joined ${MON[when.getMonth()]} ${when.getFullYear()}` : `@${user.username}`}</p></div>
          <div className="pc-btns">
            <button className="pc-pill" aria-expanded={tray} onClick={() => setTray(t => !t)}>Avatar</button>
            <button className="pc-round" aria-label={`Switch to ${style === 'light' ? 'gradient' : 'light'} card`} onClick={() => pick(style === 'light' ? 'gradient' : 'light')}>
              <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" /></svg>
            </button>
          </div>
          <hr className="pc-hr" />
          <div className="pc-stats">{stats.map(([n, label, k]) => <div className="pc-stat" key={label}><div><Glyph k={k} /><b data-n={n}>{n}</b></div><span>{label}</span></div>)}</div>
          <button className="pc-cta" onClick={() => (wrote ? close() : close(onWrite))}>
            <span className="pc-arrow"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
            <span className="pc-t">{wrote ? 'Back to diary' : 'Write today'}</span>
          </button>
        </div>
        {tray && <div className="avs pf-tray">{Array.from({ length: AVATARS }, (_, i) => <button key={i} className={'av' + (user.avatar === i ? ' on' : '')} aria-label={`Avatar ${i + 1}`} aria-pressed={user.avatar === i} onClick={() => chooseAvatar(i)}><Avatar id={i} size="100%" /></button>)}</div>}
        {msg && <p className="err mono tiny" role="alert">{msg}</p>}
      </div>
    </div>)
}
