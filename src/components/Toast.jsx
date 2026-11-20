import { useEffect } from 'react'
import { motion } from 'framer-motion'
export default function Toast({ onUndo, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 5000); return () => clearTimeout(t) }, [onDone])
  return (
    <motion.div className="toast mono" role="status" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
      ENTRY DELETED <button onClick={onUndo}>UNDO ↩</button>
    </motion.div>)
}
