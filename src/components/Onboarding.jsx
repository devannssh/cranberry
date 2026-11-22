import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import Avatar, { AVATARS } from './Avatar.jsx'
import { api } from '../lib/api.js'
import { useUser } from '../lib/user.js'
import { calm } from '../lib/fx.js'
import Backdrop from './Backdrop.jsx'
const RE = /^[a-z0-9_]{3,20}$/
// Shown once, right after the first sign-up (and to any older account without a username): pick a unique @handle and an avatar.
export default function Onboarding({ onLogout }) {
  const { setUser } = useUser()
  const [name, setName] = useState(''), [avatar, setAvatar] = useState(0)
  const [chk, setChk] = useState({ s: 'idle', msg: '' }) // idle | checking | ok | bad
  const [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const root = useRef(null), tile = useRef(null)
  const v = name.toLowerCase()

  useLayoutEffect(() => {
    if (calm()) return
    const ctx = gsap.context(() => {
      gsap.from('.ob-in', { y: 26, opacity: 0, stagger: 0.08, duration: 0.6, ease: 'power3.out' })
      gsap.from('.av', { scale: 0, rotate: -40, stagger: 0.04, duration: 0.5, ease: 'back.out(2.4)', delay: 0.35, clearProps: 'transform' })
    }, root)
    return () => ctx.revert()
  }, [])

  useEffect(() => { // live availability, after you stop typing for a moment
    if (!v) return setChk({ s: 'idle', msg: '' })
    if (!RE.test(v)) return setChk({ s: 'bad', msg: v.length < 3 ? 'at least 3 characters' : 'letters, numbers and _ only' })
    setChk({ s: 'checking', msg: 'checking…' })
    let live = true
    const t = setTimeout(() => {
      api(`/auth/username-available?u=${encodeURIComponent(v)}`)
        .then(r => live && setChk(r.available ? { s: 'ok', msg: `@${v} is yours` } : { s: 'bad', msg: r.reason || 'already taken' }))
        .catch(() => live && setChk({ s: 'idle', msg: '' }))
    }, 350)
    return () => { live = false; clearTimeout(t) }
  }, [v])
  useEffect(() => { // the preview tile bumps when a name checks out
    if (chk.s === 'ok' && !calm()) gsap.fromTo(tile.current, { scale: 1.06 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1,0.4)' })
  }, [chk.s])

  const submit = async (e) => {
    e.preventDefault(); if (busy || chk.s !== 'ok') return
    setBusy(true); setErr('')
    try { setUser((await api('/auth/me', { method: 'PATCH', body: { username: v, avatar } })).user) }
    catch (x) { setErr(x.message); setBusy(false); if (x.status === 409) setChk({ s: 'bad', msg: 'already taken' }) }
  }
  return (
    <main className="stage" ref={root}>
      <Backdrop />
      <header className="mono tiny above"><span>CRANBERRY.</span><span>STEP 2 / 2</span><button className="snd" onClick={onLogout}>SIGN OUT</button></header>
      <form className="composer auth ob above" onSubmit={submit}>
        <h1 className="ob-in">Pick a<br />handle<i>.</i></h1>
        <p className="mono tiny ob-in ob-sub">UNIQUE · 3–20 LETTERS, NUMBERS OR _ · SHOWN ON YOUR FOLDERS</p>
        <label className="ob-name ob-in"><span>@</span>
          <input autoFocus autoComplete="username" spellCheck="false" autoCapitalize="none" maxLength={20} placeholder="yourname" value={name}
            onChange={e => setName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} /></label>
        <p className={'mono tiny ob-status ' + chk.s} role="status">{chk.msg || '\u00A0'}</p>
        <div className="ob-tile ob-in" ref={tile}><span className="mono tiny">{`client: ${v || '…'}`}</span><Avatar id={avatar} size={46} /></div>
        <p className="mono tiny ob-in ob-sub">AVATAR</p>
        <div className="avs">
          {Array.from({ length: AVATARS }, (_, i) => (
            <button type="button" key={i} className={'av' + (avatar === i ? ' on' : '')} aria-label={`Avatar ${i + 1}`} aria-pressed={avatar === i} onClick={() => setAvatar(i)}><Avatar id={i} size="100%" /></button>))}
        </div>
        {err && <p className="err mono tiny" role="alert">{err}</p>}
        <div className="row ob-in"><span /><button type="submit" className="solid mono" disabled={busy || chk.s !== 'ok'}>{busy ? '…' : 'CONTINUE →'}</button></div>
      </form>
    </main>)
}
