import { useState } from 'react'
import { motion } from 'framer-motion'
import CharCounter from './CharCounter.jsx'
import { THEMES } from '../lib/themes.js'
import Mood from './Mood.jsx'
import { MOODS } from '../hooks/useEntries.js'
export default function Composer({ initial, onSave, onCancel }) {
  const [text, setText] = useState(initial?.text || '')
  const [mood, setMood] = useState(initial?.mood || 'sun')
  const [bg, setBg] = useState(initial?.bg || 'paper')
  const [tag, setTag] = useState(initial?.tag || '')
  const submit = () => text.trim() && onSave(text.trim(), mood, tag.trim(), bg)
  return (
    <motion.div className="composer" initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }}>
      <textarea autoFocus maxLength={160} rows={3} value={text} placeholder="One small note. 160 characters."
        onChange={e => setText(e.target.value)} onKeyDown={e => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && submit()} />
      <div className="row"><CharCounter n={text.length} />
        <input className="mono tag" maxLength={16} placeholder="#tag" value={tag} onChange={e => setTag(e.target.value.replace(/[#\s]/g, ''))} /></div>
      <div className="row">
        <div className="moods" role="radiogroup" aria-label="Mood">
          {MOODS.map(m => <button key={m} role="radio" aria-checked={mood === m} className={mood === m ? 'on' : ''} onClick={() => setMood(m)}><Mood mood={m} size={22} /></button>)}
        </div>
        <span><button className="ghost mono" onClick={onCancel}>CANCEL</button> <button className="solid mono" onClick={submit}>SAVE ⌘↵</button></span>
      </div>
      <div className="row"><span className="mono tiny">CARD COLOUR</span><span className="swatches">{Object.entries(THEMES).map(([k, t]) => <button key={k} aria-label={k} className={'sw' + (bg === k ? ' on' : '')} style={{ background: t.bg }} onClick={() => setBg(k)} />)}</span></div>
    </motion.div>)
}
