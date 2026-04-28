import { useEffect, useRef } from 'react'
import { useSettings } from '../store/settings'

const playChime = (high = false) => {
  try {
    const ctx = new AudioContext()
    const notes = high ? [880, 1175] : [659, 880]
    let t = ctx.currentTime
    notes.forEach((freq, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = freq
      o.connect(g)
      g.connect(ctx.destination)
      g.gain.setValueAtTime(0.001, t)
      g.gain.exponentialRampToValueAtTime(0.35, t + 0.04)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.7)
      o.start(t)
      o.stop(t + 0.7)
      t += i === 0 ? 0.35 : 0
    })
    setTimeout(() => ctx.close(), 2000)
  } catch {
    // ignore
  }
}

const fmtNow = (d: Date) =>
  `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`

export default function ChimeRunner() {
  const enabled = useSettings((s) => s.chimeEnabled)
  const chimeStart = useSettings((s) => s.chimeStart)
  const chimeEnd = useSettings((s) => s.chimeEnd)
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
          playChime(false)
          lastFired.current = cur
          return
        }
        if (chimeEnd && p.end === cur) {
          playChime(true)
          lastFired.current = cur
          return
        }
      }
    }
    tick()
    const id = window.setInterval(tick, 15_000)
    return () => clearInterval(id)
  }, [enabled, chimeStart, chimeEnd, periods])

  return null
}

export const playTestChime = (high = false) => playChime(high)
