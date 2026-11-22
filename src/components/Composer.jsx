import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import CharCounter from './CharCounter.jsx'
import { THEMES } from '../lib/themes.js'
import Mood from './Mood.jsx'
import { MOODS } from '../hooks/useEntries.js'
import { calm } from '../lib/fx.js'
import { tick } from '../lib/tick.js'
export default function Composer({ initial, onSave, onCancel }) {
  const [text, setText] = useState(initial?.text || '')
  const [mood, setMood] = useState(initial?.mood || 'sun')
  const [bg, setBg] = useState(initial?.bg || 'paper')
  const [tag, setTag] = useState(initial?.tag || '')
  const ta = useRef(null), prev = useRef(text.length)
  const submit = () => text.trim() && onSave(text.trim(), mood, tag.trim(), bg)
  useEffect(() => { // hitting the 160 limit by typing: the text box rattles and thunks
    if (text.length >= 160 && prev.current < 160 && !calm()) { gsap.fromTo(ta.current, { x: -7 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.2)' }); tick(0.8) }
    prev.current = text.length
  }, [text.length])
  const pickMood = (m, e) => { // the chosen glyph pops
    setMood(m)
    if (!calm()) gsap.fromTo(e.currentTarget.querySelector('svg'), { scale: 0.4, rotate: -35 }, { scale: 1, rotate: 0, duration: 0.55, ease: 'back.out(3)' })
  }
  return (
    <motion.div className="composer" initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }}>
      <textarea ref={ta} autoFocus maxLength={160} rows={3} value={text} placeholder="One small note. 160 characters."
        onChange={e => setText(e.target.value)} onKeyDown={e => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && submit()} />
      <div className="row"><CharCounter n={text.length} />
        <input className="mono tag" maxLength={16} placeholder="#tag" value={tag} onChange={e => setTag(e.target.value.replace(/[#\s]/g, ''))} /></div>
      <div className="row">
        <div className="moods" role="radiogroup" aria-label="Mood">
          {MOODS.map(m => <button key={m} role="radio" aria-checked={mood === m} className={mood === m ? 'on' : ''} onClick={(e) => pickMood(m, e)}><Mood mood={m} size={22} /></button>)}
        </div>
        <span><button className="ghost mono" onClick={onCancel}>CANCEL</button> <button className="solid mono" onClick={submit}>SAVE ⌘↵</button></span>
      </div>
      <div className="row"><span className="mono tiny">CARD COLOUR</span><span className="swatches">{Object.entries(THEMES).map(([k, t]) => <button key={k} aria-label={k} className={'sw' + (bg === k ? ' on' : '')} style={{ background: t.bg }} onClick={() => setBg(k)} />)}</span></div>
    </motion.div>)
}
