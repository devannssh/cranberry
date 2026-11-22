import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import Avatar from './Avatar.jsx'
import { useUser } from '../lib/user.js'
import { calm } from '../lib/fx.js'
// Navbar: @username (with avatar). Click for a dropdown: Profile / Sign out.
export default function UserMenu({ onProfile, onLogout }) {
  const { user } = useUser()
  const [open, setOpen] = useState(false)
  const wrap = useRef(null), btn = useRef(null), menu = useRef(null)
  useEffect(() => {
    if (!open) return
    const out = (e) => { if (!wrap.current.contains(e.target)) setOpen(false) }
    // capture + stopPropagation so this Escape only closes the menu, not the folder behind it
    const esc = (e) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false) } }
    addEventListener('pointerdown', out); addEventListener('keydown', esc, true)
    return () => { removeEventListener('pointerdown', out); removeEventListener('keydown', esc, true) }
  }, [open])
  useEffect(() => { // unfolds from the top edge, items drop in one by one
    if (!open || calm()) return
    const m = menu.current
    gsap.fromTo(m, { scaleY: 0.4, opacity: 0, transformOrigin: '50% 0' }, { scaleY: 1, opacity: 1, duration: 0.35, ease: 'back.out(2)' })
    gsap.from(m.querySelectorAll('button'), { y: -8, opacity: 0, stagger: 0.06, duration: 0.3, delay: 0.08 })
  }, [open])
  return (
    <span className="umenu" ref={wrap}>
      <button ref={btn} className="uname" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <Avatar id={user.avatar} size={26} /><span className="un">{`@${user.username}`}</span><i aria-hidden="true">▾</i>
      </button>
      {open && (
        <div className="menu" role="menu" ref={menu}>
          <p className="mono tiny">{user.email}</p>
          <button role="menuitem" className="mono tiny" onClick={() => { setOpen(false); onProfile(btn.current.getBoundingClientRect()) }}>PROFILE</button>
          <button role="menuitem" className="mono tiny" onClick={onLogout}>SIGN OUT</button>
        </div>)}
    </span>)
}
