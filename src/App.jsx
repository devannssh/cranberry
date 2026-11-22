import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Shelf from './components/Shelf.jsx'
import MonthSwitcher from './components/MonthSwitcher.jsx'
import EntryStack from './components/EntryStack.jsx'
import Composer from './components/Composer.jsx'
import MouseFollower from './components/MouseFollower.jsx'
import Toast from './components/Toast.jsx'
import Nav from './components/Nav.jsx'
import Profile from './components/Profile.jsx'
import Dash from './components/Dash.jsx'
import FooterMark from './components/FooterMark.jsx'
import { MonthPanel, Highlights } from './components/MonthSide.jsx'
import Mag from './components/Mag.jsx'
import useEntries, { streak } from './hooks/useEntries.js'
import { todayISO } from './lib/storage.js'
import { soundOn, setSound, tick } from './lib/tick.js'
import { useUser } from './lib/user.js'
import { stamp } from './lib/fx.js'
export default function App({ onLogout }) {
  const { user } = useUser()
  const { entries, loading, error, clearError, save, update, remove, restore, undo, dismissUndo } = useEntries()
  const [sound, setSoundState] = useState(soundOn)
  const toggleSound = () => { const v = !sound; setSound(v); setSoundState(v); if (v) setTimeout(() => tick(0.4), 60) } // the click that turns it on also wakes the audio engine
  const now = new Date()
  const [picked, setPicked] = useState(null) // folder being opened (plays the open animation)
  const [ym, setYm] = useState(null)         // {y, m} while inside a folder; null = on the shelf
  const [last, setLast] = useState(null)     // folder to re-centre when we come back to the shelf
  const [composer, setComposer] = useState(null) // null | {entry?}
  const [profile, setProfile] = useState(null)   // null | {x, y}: where the profile's circle reveal grows from
  const [jump, setJump] = useState(null)         // null | {date, k}: the card the stack should show (calendar, heatmap, "on this day")
  const today = entries.find(e => e.date === todayISO())
  // One folder per month: January of the first year with entries (or this year) up to the current month.
  const months = useMemo(() => {
    const y0 = Math.min(now.getFullYear(), ...entries.map(e => +e.date.slice(0, 4))), out = []
    for (let y = y0; y <= now.getFullYear(); y++) for (let m = 0; m < 12 && (y < now.getFullYear() || m <= now.getMonth()); m++) out.push({ y, m })
    return out
  }, [entries])
  const idx = ym ? months.findIndex(x => x.y === ym.y && x.m === ym.m) : -1
  const isNow = !!ym && ym.y === now.getFullYear() && ym.m === now.getMonth()
  const prefix = ym ? `${ym.y}-${String(ym.m + 1).padStart(2, '0')}` : ''
  const monthEntries = useMemo(() => entries.filter(e => e.date.startsWith(prefix)), [entries, prefix])
  const shift = (d) => { setJump(null); setYm(c => months[months.findIndex(x => x.y === c.y && x.m === c.m) + d] || c) }
  const pick = (y, m, date) => { if (picked) return; setJump(date ? { date, k: Date.now() } : null); setPicked(`${y}-${m}`); setTimeout(() => setYm({ y, m }), 360) }
  const close = () => { setLast(`${ym.y}-${ym.m}`); setPicked(null); setYm(null) }
  useEffect(() => {
    const k = (e) => {
      if (profile) return // the profile screen handles its own keys
      const typing = /TEXTAREA|INPUT/.test(e.target.tagName)
      if (e.key === 'Escape') composer ? setComposer(null) : ym && close()
      else if (ym && !composer && !typing && e.key === 'ArrowLeft') shift(-1)
      else if (ym && !composer && !typing && e.key === 'ArrowRight') shift(1)
    }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  }, [ym, composer, months, profile])
  const onSave = async (text, mood, tag, bg) => {
    const e = composer.entry, date = e?.date || todayISO()
    if (await save({ text, mood, tag, bg, date })) { // stays open if the server said no
      setComposer(null)
      stamp({ date, streak: streak([...entries.filter(x => x.date !== date), { date }]) })
    }
  }
  if (loading) return <main className="stage"><p className="hint mono tiny">LOADING ENTRIES…</p></main>
  return (
    <main className="stage">
      <MouseFollower />
      <Nav streak={streak(entries)} sound={sound} onSound={toggleSound} onLogout={onLogout}
        onProfile={(r) => setProfile({ x: r.left + r.width / 2, y: r.top + r.height / 2 })} />
      <AnimatePresence mode="wait">
        {!ym ? (
          <motion.section key="shelf" className="home" exit={{ opacity: 0, scale: 1.12 }} transition={{ duration: 0.22 }}>
            <Shelf entries={entries} months={months} picked={picked} focus={last} onPick={pick} locked={!!profile} />
            <p className="hint mono tiny">DRAG OR SCROLL ↔ CLICK A FOLDER TO OPEN</p>
            <Dash entries={entries} onWrite={() => setComposer({ entry: today })} onOpen={pick} />
            <FooterMark username={user.username} />
          </motion.section>
        ) : (
          <motion.section key="inside" className="insidewrap" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
            <aside className="side left"><MonthPanel y={ym.y} m={ym.m} entries={monthEntries} onJump={(date) => setJump({ date, k: Date.now() })} /></aside>
            <div className="inside">
              <div className="itop">
                <Mag className="back mono tiny" strength={0.2} onClick={close}>← Folders</Mag>
                <MonthSwitcher y={ym.y} m={ym.m} onShift={shift} canPrev={idx > 0} canNext={idx < months.length - 1} />
              </div>
              <EntryStack key={prefix} entries={monthEntries} focus={jump} emptyText={isNow ? 'No entries yet. Start today.' : 'Nothing written this month.'}
                onEdit={e => setComposer({ entry: e })} onDelete={remove} onColor={(e, bg) => update(e, { bg })} />
              {isNow && <div className="iadd"><Mag className="add mono" strength={0.3} onClick={() => setComposer({ entry: today })}><span className="plus">+</span>{today ? 'Edit today' : 'Add entry'}</Mag></div>}
            </div>
            <aside className="side right"><Highlights entries={monthEntries} pre={prefix} /></aside>
          </motion.section>)}
      </AnimatePresence>
      <AnimatePresence>
        {composer && (
          <motion.div key="c" className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onMouseDown={e => e.target === e.currentTarget && setComposer(null)}>
            <Composer initial={composer.entry} onSave={onSave} onCancel={() => setComposer(null)} />
          </motion.div>)}
      </AnimatePresence>
      <AnimatePresence>{undo && <Toast key="t" onUndo={restore} onDone={dismissUndo} />}</AnimatePresence>
      {profile && <Profile origin={profile} entries={entries} onClose={() => setProfile(null)} onWrite={() => setComposer({ entry: today })} />}
      {error && <button className="errbar mono tiny" role="alert" onClick={clearError}>{error} ✕</button>}
    </main>)
}
