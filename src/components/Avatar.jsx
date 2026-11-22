// Geometric avatars in the app's own palette and shapes (same family as the mood glyphs). No uploads, so nothing to store or moderate.
// Every avatar gets the same ink ring, drawn on top. Before, a few had a pale background (one was exactly the page colour), so on the
// profile page their circle melted away and they looked smaller than the rest. The head shapes are also sized to the same visual weight.
const O = '#F25004', K = '#111', P = '#F2F2F0', G = '#E6E6E4', S = '#D8D2C4', M = '#BFE3CF'
const A = [
  { bg: O, head: 'circle', hc: P, body: K, eye: K }, { bg: K, head: 'circle', hc: O, body: P, eye: K },
  { bg: M, head: 'square', hc: K, body: O, eye: P }, { bg: S, head: 'tri', hc: O, body: K, eye: P },
  { bg: '#fff', head: 'quarter', hc: K, body: O, eye: P }, { bg: G, head: 'circle', hc: K, body: M, eye: P },
  { bg: O, head: 'square', hc: K, body: P, eye: O }, { bg: M, head: 'tri', hc: K, body: S, eye: M },
]
export const AVATARS = A.length // keep in sync with AVATARS in server/src/validation.js
const HEAD = {
  circle: <circle cx="50" cy="42" r="23" />, square: <rect x="27" y="19" width="46" height="46" rx="5" />,
  tri: <path d="M50 13L80 66H20Z" />, quarter: <path d="M25 66V21A45 45 0 0 1 70 66Z" />,
}
const EYE_Y = { circle: 43, square: 43, tri: 54, quarter: 47 }
export default function Avatar({ id = 0, size = 40 }) {
  const a = A[((id % A.length) + A.length) % A.length], ey = EYE_Y[a.head]
  return (
    <svg className="avatar" width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="avatar">
      <rect width="100" height="100" fill={a.bg} /><path d="M6 100A44 44 0 0 1 94 100Z" fill={a.body} />
      <g fill={a.hc}>{HEAD[a.head]}</g><g fill={a.eye}><circle cx="42" cy={ey} r="3.2" /><circle cx="58" cy={ey} r="3.2" /></g>
      <circle cx="50" cy="50" r="48" fill="none" stroke="#111" strokeWidth="4" />
    </svg>)
}
