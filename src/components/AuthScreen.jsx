import { useState } from 'react'
import { api } from '../lib/api.js'
import Backdrop from './Backdrop.jsx'
import { Berry } from './Wordmark.jsx'
export default function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState(''), [password, setPassword] = useState('')
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const login = mode === 'login'
  const submit = async (e) => {
    e.preventDefault(); if (busy) return
    setBusy(true); setErr('')
    try { onAuthed((await api(`/auth/${login ? 'login' : 'register'}`, { method: 'POST', body: { email, password } })).user) }
    catch (x) { setErr(x.message); setBusy(false) }
  }
  return (
    <main className="stage">
      <Backdrop />
      <header className="mono tiny above"><span>CRANBERRY.</span><span>{login ? 'SIGN IN' : 'NEW ACCOUNT'}</span><span /></header>
      <form className="composer auth above" onSubmit={submit}>
        <h1 className="auth-h"><Berry size={40} />cranberry<i>.</i></h1>
        <input type="email" autoComplete="email" placeholder="Email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" autoComplete={login ? 'current-password' : 'new-password'} placeholder="Password (8+ characters)" required minLength={login ? undefined : 8} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} />
        {err && <p className="err mono tiny" role="alert">{err}</p>}
        <div className="row">
          <button type="button" className="ghost mono" onClick={() => { setMode(login ? 'register' : 'login'); setErr('') }}>{login ? 'CREATE ACCOUNT' : 'I HAVE AN ACCOUNT'}</button>
          <button type="submit" className="solid mono" disabled={busy}>{busy ? '…' : login ? 'SIGN IN' : 'SIGN UP'}</button>
        </div>
      </form>
    </main>)
}
