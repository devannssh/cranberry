import { motion } from 'framer-motion'
import FolderFace from './FolderFace.jsx'
const spring = { type: 'spring', stiffness: 170, damping: 22 }
// One month folder. role: 'rest' (on the shelf) | 'picked' (opening: flap swings, folder swells) | 'other' (fades away).
// Empty months get no peeking papers, so they read as flat, unused folders.
export default function Folder({ role, onPick, label, count, ...face }) {
  const rest = role === 'rest', picked = role === 'picked'
  return (
    <motion.div className="folder" initial="rest" transition={spring} whileHover={rest ? { y: -8 } : undefined}
      animate={{ y: picked ? -6 : 0, scale: picked ? 1.1 : role === 'other' ? 0.88 : 1, opacity: role === 'other' ? 0 : 1 }}>
      <div className="fback"><span className="ftab mono tiny">{label}</span></div>
      {count > 0 && <motion.div className="papers" animate={{ y: picked ? -22 : 0 }} transition={spring}><i /><i /></motion.div>}
      <motion.button className="fflap" aria-label={`Open ${label}`} onClick={onPick}
        variants={{ rest: { rotateX: 0 }, hover: { rotateX: 9 } }} whileHover={rest ? 'hover' : undefined}
        animate={picked ? { rotateX: 72 } : undefined} transition={spring}>
        <FolderFace {...face} />
      </motion.button>
    </motion.div>)
}
