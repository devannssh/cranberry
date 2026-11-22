import React from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import Gate from './Gate.jsx'
import './styles.css'
createRoot(document.getElementById('root')).render(
  <MotionConfig reducedMotion="user"><Gate /></MotionConfig>)
