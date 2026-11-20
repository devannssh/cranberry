import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
// Orange dot (instant) + ring (spring-lagged) that grows over interactive elements.
export default function MouseFollower() {
  const x = useMotionValue(-100), y = useMotionValue(-100)
  const sx = useSpring(x, { stiffness: 260, damping: 26, mass: 0.4 }), sy = useSpring(y, { stiffness: 260, damping: 26, mass: 0.4 })
  const [hot, setHot] = useState(false)
  useEffect(() => {
    const mv = (e) => { x.set(e.clientX); y.set(e.clientY); setHot(!!e.target.closest?.('button,textarea,input,.wcard')) }
    addEventListener('pointermove', mv); return () => removeEventListener('pointermove', mv)
  }, [])
  return (<><motion.div className="fdot" style={{ x, y }} /><motion.div className="fring" style={{ x: sx, y: sy }} animate={{ scale: hot ? 1.7 : 1 }} /></>)
}
