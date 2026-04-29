import { useEffect, useRef } from 'react'
import { useSettings } from '../store/settings'

export type ChimeTone = 'start' | 'end' | 'prewarn'

const TONES: Record<ChimeTone, { notes: number[]; gap: number; dur: number; peak: number }> = {
  start: { notes: [659, 880], gap: 0.35, dur: 0.7, peak: 0.35 },
  end: { notes: [880, 1175], gap: 0.35, dur: 0.7, peak: 0.35 },
  prewarn: { notes: [988, 988], gap: 0.18, dur: 0.22, peak: 0.22 },
}

const playChime = (tone: ChimeTone = 'start') => {
  try {
    const ctx = new AudioContext()
    const cfg = TONES[tone]
    let t = ctx.currentTime
    cfg.notes.forEach((freq, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = freq
      o.connect(g)
      g.connect(ctx.destination)
      g.gain.setValueAtTime(0.001, t)
      g.gain.exponentialRampToValueAtTime(cfg.peak, t + 0.04)
      g.gain.exponentialRampToValueAtTime(0.001, t + cfg.dur)
      o.start(t)
      o.stop(t + cfg.dur)
      if (i < cfg.notes.length - 1) t += cfg.gap
    })
    setTimeout(() => ctx.close(), 2000)
  } catch {
    // ignore
  }
}

const fmtNow = (d: Date) =>
  `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`

const minusOneMinute = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  let total = h * 60 + m - 1
  if (total < 0) total += 24 * 60
  return `${Math.floor(total / 60)
    .toString()
    .padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`
}

export default function ChimeRunner() {
  const enabled = useSettings((s) => s.chimeEnabled)
  const chimeStart = useSettings((s) => s.chimeStart)
  const chimeEnd = useSettings((s) => s.chimeEnd)
  const chimePrewarn = useSettings((s) => s.chimePrewarn)
  const periods = useSettings((s) => s.periods)
  const lastFired = useRef<string>('')

  useEffect(() => {
    if (!enabled) return
    const tick = () => {
      const now = new Date()
      const day = now.getDay()
      if (day === 0 || day === 6) return
      const cur = fmtNow(now)
      if (lastFired.current === cur) return
      for (const p of periods) {
        if (chimeStart && p.start === cur) {
          playChime('start')
          lastFired.current = cur
          return
        }
        if (chimeEnd && p.end === cur) {
          playChime('end')
          lastFired.current = cur
          return
        }
      }
      if (chimePrewarn) {
        for (const p of periods) {
          if (minusOneMinute(p.start) === cur) {
            playChime('prewarn')
            lastFired.current = cur
            return
          }
        }
      }
    }
    tick()
    const id = window.setInterval(tick, 15_000)
    return () => clearInterval(id)
  }, [enabled, chimeStart, chimeEnd, chimePrewarn, periods])

  return null
}

export const playTestChime = (tone: ChimeTone = 'start') => playChime(tone)
