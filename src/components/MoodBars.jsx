import Mood from './Mood.jsx'
import { MOODS } from '../hooks/useEntries.js'
// One bar per mood, with the mood's own glyph.
export default function MoodBars({ entries }) {
  const counts = MOODS.map(m => [m, entries.filter(e => e.mood === m).length]), max = Math.max(1, ...counts.map(c => c[1]))
  return (
    <div className="mbars">
      {counts.map(([m, n]) => (
        <div className="mb" key={m} title={m}><Mood mood={m} size={20} /><div className="mbar"><i style={{ '--w': `${(n / max) * 100}%` }} /></div><b className="mono tiny">{n}</b></div>))}
    </div>)
}
