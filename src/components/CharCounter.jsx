export default function CharCounter({ n, max = 160 }) {
  return <span className={'mono counter' + (n >= max - 20 ? ' hot' : '')}>{n} / {max}</span>
}
