import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import PatternArt from './PatternArt.jsx'
import CharCounter from './CharCounter.jsx'
import Mood from './Mood.jsx'
import { THEMES } from '../lib/themes.js'
const DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'], MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
// d = distance from the front card. Negative = stacked above, positive = stacked below.
export default function EntryCard({ entry, index, d, onSelect, onSwipe, onEdit, onDelete, onColor }) {
  const a = Math.abs(d), active = d === 0, vis = a <= 3, th = THEMES[entry.bg] || THEMES.paper
  const first = useRef(true); useEffect(() => { first.current = false }, [])
  const dt = new Date(entry.date + 'T00:00:00')
  return (
    <motion.article className={'wcard' + (active ? ' act' : '')} onClick={() => !active && onSelect()}
      style={{ background: th.bg, color: th.fg, zIndex: 100 - a, pointerEvents: vis ? 'auto' : 'none' }}
      initial={{ y: -80, opacity: 0, scale: 0.9 }} animate={{ y: 110 + d * 34, scale: 1 - a * 0.04, opacity: vis ? 1 : 0 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 32, delay: first.current ? Math.min(index, 6) * 0.06 : 0 }}
      drag={active ? 'y' : false} dragSnapToOrigin dragElastic={0.25}
      onDragEnd={(_, i) => { if (i.offset.y < -40) onSwipe(1); else if (i.offset.y > 40) onSwipe(-1) }}>
      <header className="whead mono tiny"><span>{DAYS[dt.getDay()]} / {MON[dt.getMonth()]} {dt.getFullYear()}</span><span>ID: {String(index + 1).padStart(3, '0')}</span><Mood mood={entry.mood} /></header>
      <div className="wmain"><div className="wbig">{dt.getDate()}<i>.</i></div><PatternArt date={entry.date} size={84} /></div>
      <p className="wtext">{entry.text}</p>
      <div className="wfoot mono tiny"><CharCounter n={entry.text.length} /><span>MOOD: {entry.mood.toUpperCase()}{entry.tag ? ` / #${entry.tag}` : ''}</span></div>
      <div className="wact mono tiny">
        <span className="swatches">{Object.entries(THEMES).map(([k, t]) => <button key={k} aria-label={'Background ' + k} className={'sw' + (entry.bg === k ? ' on' : '')} style={{ background: t.bg }} onClick={(e) => { e.stopPropagation(); onColor(entry, k) }} />)}</span>
        <span><button onClick={(e) => { e.stopPropagation(); onEdit() }}>EDIT ↗</button> <button className="del" onClick={(e) => { e.stopPropagation(); onDelete() }}>DELETE ✕</button></span>
      </div>
    </motion.article>)
}
