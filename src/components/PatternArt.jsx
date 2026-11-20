// Deterministic geometric art: the date string picks one of 6 patterns.
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
export default function PatternArt({ date, size = 120 }) {
  const k = hash(date) % 6, O = 'var(--orange)', K = 'var(--ink)', G = 'var(--grey)'
  const p = [
    <><path d="M0 120A60 60 0 0 1 60 60V120Z" fill={O}/><path d="M60 120V60A60 60 0 0 1 120 120Z" fill={K}/><path d="M0 60H120V0H0Z" fill={G}/></>,
    <>{Array.from({ length: 48 }, (_, i) => <circle key={i} cx={10 + (i % 6) * 20} cy={10 + Math.floor(i / 6) * 14} r={i % 7 === 0 ? 3 : 5.5} fill={i % 5 === 0 ? K : O}/>)}</>,
    <><rect width="120" height="120" fill={K}/>{Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${i * 16 - 20} 120L${i * 16 + 40} 0`} stroke={O} strokeWidth="5"/>)}</>,
    <><rect width="120" height="120" fill={G}/>{[100, 70, 40].map((r, i) => <path key={r} d={`M${120 - r} 120A${r} ${r} 0 0 1 120 ${120 - r}`} fill="none" stroke={i % 2 ? O : K} strokeWidth="14"/>)}</>,
    <>{Array.from({ length: 16 }, (_, i) => ((i + Math.floor(i / 4)) % 2 ? <rect key={i} x={(i % 4) * 30} y={Math.floor(i / 4) * 30} width="30" height="30" fill={O}/> : null))}</>,
    <><rect width="120" height="120" fill={K}/><path d="M0 120V0A120 120 0 0 1 120 120Z" fill={O}/><circle cx="84" cy="84" r="16" fill="var(--paper)"/></>,
  ]
  return <svg className="art" width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">{p[k]}</svg>
}
