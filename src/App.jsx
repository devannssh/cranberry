import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Shelf from './components/Shelf.jsx'
import MonthSwitcher from './components/MonthSwitcher.jsx'
import EntryStack from './components/EntryStack.jsx'
import Composer from './components/Composer.jsx'
import MouseFollower from './components/MouseFollower.jsx'
import Toast from './components/Toast.jsx'
import useEntries from './hooks/useEntries.js'
import { todayISO } from './lib/storage.js'
import { soundOn, setSound, tick } from './lib/tick.js'
export default function App() {
  const { entries, save, update, remove, restore, undo, dismissUndo } = useEntries()
  const [sound, setSoundState] = useState(soundOn)
  const toggleSound = () => { const v = !sound; setSound(v); setSoundState(v); if (v) setTimeout(() => tick(0.4), 60) } // the click that turns it on also wakes the audio engine
  const now = new Date()
  const [picked, setPicked] = useState(null) // folder being opened (plays the open animation)
  const [ym, setYm] = useState(null)         // {y, m} while inside a folder; null = on the shelf
  const [last, setLast] = useState(null)     // folder to re-centre when we come back to the shelf
  const [composer, setComposer] = useState(null) // null | {entry?}
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
  const shift = (d) => setYm(c => months[months.findIndex(x => x.y === c.y && x.m === c.m) + d] || c)
  const pick = (y, m) => { if (picked) return; setPicked(`${y}-${m}`); setTimeout(() => setYm({ y, m }), 360) }
  const close = () => { setLast(`${ym.y}-${ym.m}`); setPicked(null); setYm(null) }
  useEffect(() => {
    const k = (e) => {
      const typing = /TEXTAREA|INPUT/.test(e.target.tagName)
      if (e.key === 'Escape') composer ? setComposer(null) : ym && close()
      else if (ym && !composer && !typing && e.key === 'ArrowLeft') shift(-1)
      else if (ym && !composer && !typing && e.key === 'ArrowRight') shift(1)
    }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  }, [ym, composer, months])
  const onSave = (text, mood, tag, bg) => {
    const e = composer.entry
    save({ text, mood, tag, bg, date: e?.date || todayISO(), id: e?.id })
    setComposer(null)
  }
  return (
    <main className="stage">
      <MouseFollower />
      <header className="mono tiny"><span>DAILY.</span><span>MODE: STANDALONE</span><span>DATE: {now.getDate()} {now.toLocaleString('en', { month: 'short' }).toUpperCase()}</span>
        <button className="snd" aria-pressed={sound} title="Scroll sounds on / off" onClick={toggleSound}>SOUND: {sound ? 'ON' : 'OFF'}</button></header>
      <AnimatePresence mode="wait">
        {!ym ? (
          <motion.section key="shelf" className="home" exit={{ opacity: 0, scale: 1.12 }} transition={{ duration: 0.22 }}>
            <Shelf entries={entries} months={months} picked={picked} focus={last} onPick={pick} />
            <p className="hint mono tiny">DRAG OR SCROLL ↔ CLICK A FOLDER TO OPEN</p>
          </motion.section>
        ) : (
          <motion.section key="inside" className="inside" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
            <div className="itop">
              <button className="back mono tiny" onClick={close}>← Folders</button>
              <MonthSwitcher y={ym.y} m={ym.m} onShift={shift} canPrev={idx > 0} canNext={idx < months.length - 1} />
            </div>
            <EntryStack key={prefix} entries={monthEntries} emptyText={isNow ? 'No entries yet. Start today.' : 'Nothing written this month.'}
              onEdit={e => setComposer({ entry: e })} onDelete={remove} onColor={(e, bg) => update(e, { bg })} />
            {isNow && <div className="iadd"><button className="add mono" onClick={() => setComposer({ entry: today })}><span className="plus">+</span>{today ? 'Edit today' : 'Add entry'}</button></div>}
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
    </main>)
}
