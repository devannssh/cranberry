// Scroll "tick" — a tiny mechanical click synthesised with Web Audio, so there are no audio files to ship.
// It reacts to how fast you scroll (speed 0 → 1):
//   slow  → deeper, rounder, a touch longer and fuller   ("tok")
//   fast  → brighter, shorter, lighter                   ("tic")
// Every tick also gets a few % of random pitch drift, so a run of them never sounds like a machine gun.
const KEY = 'journal.sound'
const VOLUME = 0.8 // master level, 0 → 1. Turn this down if the ticks feel too loud.
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))

let ctx = null, out = null, noise = null, enabled = true
try { enabled = localStorage.getItem(KEY) !== 'off' } catch { /* private mode: stay on */ }

export const soundOn = () => enabled
export const setSound = (on) => { enabled = on; try { localStorage.setItem(KEY, on ? 'on' : 'off') } catch { /* ignore */ } }

// One tick, scheduled at audio-clock time `t`. Takes the context so it can also be rendered offline (tests).
export function voice(ac, dest, noiseBuf, t, speed) {
  const s = clamp(speed), j = 1 + (Math.random() - 0.5) * 0.07
  const vol = 0.95 - s * 0.12             // fast ticks are individually a touch lighter
  const body = 700 * 2 ** (s * 1.4) * j   // 700 Hz → ~1850 Hz
  const decay = 0.036 - s * 0.02          // 36 ms → 16 ms
  const env = (g, peak, attack, len) => {
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + len)
  }
  const tone = (f0, f1, glide, peak, len) => {
    const o = ac.createOscillator(), g = ac.createGain()
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + glide)
    env(g, peak, 0.001, len); o.connect(g); g.connect(dest); o.start(t); o.stop(t + len + 0.01)
  }
  // 1 · the "tic": ~10 ms of band-passed noise
  const n = ac.createBufferSource(), bp = ac.createBiquadFilter(), ng = ac.createGain()
  n.buffer = noiseBuf; bp.type = 'bandpass'; bp.frequency.value = (2600 + s * 3000) * j; bp.Q.value = 1.4
  env(ng, vol * 1.1, 0.0005, 0.01)
  n.connect(bp); bp.connect(ng); ng.connect(dest); n.start(t, Math.random() * 0.05); n.stop(t + 0.02)
  // 2 · the body: a sine that falls a fifth in 12 ms
  tone(body * 1.5, body, 0.012, vol, decay)
  // 3 · weight: a soft low thump that fades out as you speed up
  if (s < 0.6) tone(170 * j, 105, 0.03, vol * 0.7 * (1 - s / 0.6), 0.05)
}

function boot() {
  if (ctx) return ctx
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
  if (!AC) return null
  ctx = new AC({ latencyHint: 'interactive' })
  const comp = ctx.createDynamicsCompressor() // acts as a limiter, so a fast run of ticks can never clip
  comp.threshold.value = -10; comp.knee.value = 6; comp.ratio.value = 12; comp.attack.value = 0.001; comp.release.value = 0.06
  out = ctx.createGain(); out.gain.value = VOLUME; out.connect(comp); comp.connect(ctx.destination)
  noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.1), ctx.sampleRate)
  const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return ctx
}

// Browsers only allow sound after a real gesture (click, tap, key press — a wheel scroll doesn't count).
// So the audio engine wakes on the first one of those, and stays silent until then.
function unlock() {
  if (!boot() || ctx.state === 'running') return
  ctx.resume().catch(() => {})
  const b = ctx.createBufferSource(); b.buffer = ctx.createBuffer(1, 1, 22050); b.connect(ctx.destination); b.start(0) // iOS needs a sound started inside the gesture
}
if (typeof window !== 'undefined') for (const e of ['pointerdown', 'keydown', 'touchend', 'click']) addEventListener(e, unlock, { capture: true, passive: true })

// speed 0 (slow) → 1 (fast); `delay` in seconds.
export function tick(speed = 0.4, delay = 0) {
  if (!enabled || !ctx || ctx.state !== 'running') return // never queue while suspended, or they'd all fire at once on resume
  voice(ctx, out, noise, ctx.currentTime + 0.004 + delay, speed)
}
// Several cards at once (a dot-jump): a quick ratchet run, 32 ms apart, getting a little faster.
export function tickRun(count, speed = 0.4) {
  for (let i = 0; i < Math.min(count, 10); i++) tick(clamp(speed + i * 0.03), i * 0.032)
}

// Speed from how often the thing steps (cards in the stack): 70 ms apart ≈ 1, 600 ms+ ≈ 0.
export function cadence() {
  let last = 0, s = 0
  return () => {
    const t = performance.now(), dt = t - last; last = t
    const raw = clamp(1 - Math.log(dt / 70) / Math.log(600 / 70))
    s = dt > 700 ? Math.max(0.12, raw) : s * 0.4 + raw * 0.6
    return s
  }
}
// Speed from how fast a scroller is moving, in px/ms (≈0.2 slow drift → 6 hard fling).
export const speedFromVelocity = (v) => clamp(Math.log(Math.max(v, 0.001) / 0.2) / Math.log(30))
