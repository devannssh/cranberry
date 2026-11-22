import { useRef } from 'react'
import { useMagnetic } from '../lib/fx.js'
// A <button> that leans toward the cursor.
export default function Mag({ strength = 0.3, children, ...props }) {
  const ref = useRef(null)
  useMagnetic(ref, strength)
  return <button ref={ref} {...props}>{children}</button>
}
