// Geometric mood glyphs (no emoji).
export default function Mood({ mood, size = 18 }) {
  const f = { sun: 'var(--orange)', calm: 'var(--ink)', flux: 'var(--orange)', low: 'var(--mid)', spark: 'var(--ink)' }[mood] || 'var(--mid)'
  const s = { sun: <circle cx="10" cy="10" r="9" />, calm: <path d="M1 12A9 9 0 0 1 19 12Z" />, flux: <rect x="2" y="2" width="16" height="16" />, low: <path d="M10 2L19 18H1Z" />, spark: <path d="M1 19V1A18 18 0 0 1 19 19Z" /> }[mood]
  return <svg width={size} height={size} viewBox="0 0 20 20" fill={f} aria-label={mood}>{s}</svg>
}
