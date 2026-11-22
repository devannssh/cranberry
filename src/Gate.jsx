import { useEffect, useState } from 'react'
import { api } from './lib/api.js'
import { UserCtx } from './lib/user.js'
import App from './App.jsx'
import AuthScreen from './components/AuthScreen.jsx'
import Onboarding from './components/Onboarding.jsx'
// Decides what to show: checking the session -> sign-in -> (first time only) pick a username -> the diary.
export default function Gate() {
  const [user, setUser] = useState(undefined) // undefined = checking, null = signed out
  useEffect(() => { api('/auth/me').then(r => setUser(r.user)).catch(() => setUser(null)) }, [])
  useEffect(() => { const out = () => setUser(null); addEventListener('cranberry:signed-out', out); return () => removeEventListener('cranberry:signed-out', out) }, [])
  const logout = async () => { try { await api('/auth/logout', { method: 'POST' }) } catch { /* cookie expires anyway */ } setUser(null) }
  if (user === undefined) return <main className="stage"><p className="hint mono tiny">LOADING…</p></main>
  if (!user) return <AuthScreen onAuthed={setUser} />
  return (
    <UserCtx.Provider value={{ user, setUser }}>
      {user.username ? <App key={user.id} onLogout={logout} /> : <Onboarding onLogout={logout} />}
    </UserCtx.Provider>)
}
