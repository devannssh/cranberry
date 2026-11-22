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
// Four layers, all short, so it reads as a crisp mechanical click rather than a soft thud:
//   snap  : ~5 ms of high-passed noise, the bright edge you hear first
//   click : a 10 ms triangle blip that falls a little, gives the click a pitch
//   knock : a narrow, ringing band of noise (like a wood block), the "body"
//   thump : a faint low sine, folders only, fading out as you speed up
// kind 'folder' is a touch deeper and fuller, 'card' is lighter and snappier.
export function voice(ac, dest, noiseBuf, t, speed, kind = 'folder') {
  const s = clamp(speed), j = 1 + (Math.random() - 0.5) * 0.06, card = kind === 'card'
  const vol = (card ? 0.85 : 0.95) - s * 0.1
  const env = (g, peak, attack, len) => {
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + len)
  }
  const burst = (type, freq, q, peak, attack, len) => {
    const n = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain()
    n.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q
    env(g, peak, attack, len); n.connect(f); f.connect(g); g.connect(dest); n.start(t, Math.random() * 0.05); n.stop(t + len + 0.01)
  }
  const tone = (type, f0, f1, glide, peak, len) => {
    const o = ac.createOscillator(), g = ac.createGain()
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + glide)
    env(g, peak, 0.0008, len); o.connect(g); g.connect(dest); o.start(t); o.stop(t + len + 0.01)
  }
  burst('highpass', ((card ? 4300 : 3400) + s * 2200) * j, 0.7, vol * 1.15, 0.0002, 0.006)                  // snap
  const click = ((card ? 3600 : 2700) + s * 1500) * j
  tone('triangle', click, click * 0.7, 0.006, vol * 0.45, 0.014)                                              // click
  burst('bandpass', (card ? 1900 : 1050) * 2 ** (s * 0.8) * j, 7, vol * 2.4, 0.0004, 0.026 - s * 0.01)       // knock
  if (!card && s < 0.5) tone('sine', 150 * j, 95, 0.025, vol * 0.4 * (1 - s / 0.5), 0.045)                   // thump
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
export function tick(speed = 0.4, delay = 0, kind = 'folder') {
  if (!enabled || !ctx || ctx.state !== 'running') return // never queue while suspended, or they'd all fire at once on resume
  voice(ctx, out, noise, ctx.currentTime + 0.001 + delay, speed, kind)
}
// Several cards at once (a dot-jump): a quick ratchet run, 28 ms apart, getting a little faster.
export function tickRun(count, speed = 0.4, kind = 'folder') {
  for (let i = 0; i < Math.min(count, 10); i++) tick(clamp(speed + i * 0.03), i * 0.028, kind)
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
