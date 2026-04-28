import { useEffect, useRef, useState } from 'react'

const presets = [
  { label: '1분', sec: 60 },
  { label: '3분', sec: 180 },
  { label: '5분', sec: 300 },
  { label: '10분', sec: 600 },
  { label: '15분', sec: 900 },
]

const fmt = (s: number) => {
  const m = Math.floor(Math.abs(s) / 60)
  const sec = Math.abs(s) % 60
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

export default function Timer() {
  const [total, setTotal] = useState(300)
  const [remaining, setRemaining] = useState(300)
  const [running, setRunning] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [overtime, setOvertime] = useState(false)
  const intervalRef = useRef<number | null>(null)
  const audioRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const beep = () => {
    try {
      if (!audioRef.current) audioRef.current = new AudioContext()
      const ctx = audioRef.current
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = 880
      o.connect(g)
      g.connect(ctx.destination)
      g.gain.setValueAtTime(0.001, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.02)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
      o.start()
      o.stop(ctx.currentTime + 0.6)
    } catch {
      // ignore
    }
  }

  const start = () => {
    if (running) return
    setRunning(true)
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        const next = r - 1
        if (r === 1) beep()
        if (next < 0) setOvertime(true)
        return next
      })
    }, 1000)
  }

  const pause = () => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const reset = () => {
    pause()
    setRemaining(total)
    setOvertime(false)
  }

  const setMinutes = (sec: number) => {
    pause()
    setTotal(sec)
    setRemaining(sec)
    setOvertime(false)
  }

  const progress = total > 0 ? Math.max(0, remaining) / total : 0

  return (
    <div
      className={`${
        fullscreen
          ? 'fixed inset-0 z-50 flex flex-col items-center justify-center'
          : 'p-6'
      }`}
      style={
        fullscreen
          ? {
              background:
                'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.4) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(236, 72, 153, 0.3) 0px, transparent 50%), #0f172a',
            }
          : undefined
      }
    >
      {fullscreen && (
        <button
          onClick={() => setFullscreen(false)}
          className="absolute top-6 right-6 px-4 py-2 rounded-xl text-slate-300 hover:text-white text-sm border border-white/20 backdrop-blur-md bg-white/10 hover:bg-white/20 transition"
        >
          ✕ 닫기
        </button>
      )}

      <div className={fullscreen ? '' : 'max-w-2xl'}>
        {!fullscreen && (
          <h1 className="text-3xl font-bold tracking-tight mb-6 bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">
            타이머
          </h1>
        )}

        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {presets.map((p) => (
            <button
              key={p.sec}
              onClick={() => setMinutes(p.sec)}
              className={`px-4 py-2 rounded-xl text-sm transition ${
                total === p.sec
                  ? fullscreen
                    ? 'bg-white/90 text-slate-900 border border-white'
                    : 'glass-btn-primary'
                  : fullscreen
                    ? 'border border-white/20 text-slate-300 hover:bg-white/10 backdrop-blur-md'
                    : 'glass-btn text-slate-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div
          className={`text-center mb-8 ${
            fullscreen ? '' : 'glass-strong rounded-3xl p-12'
          }`}
        >
          <div
            className={`font-mono font-black tabular-nums tracking-tight ${
              overtime
                ? 'bg-gradient-to-br from-red-500 to-rose-600 bg-clip-text text-transparent'
                : fullscreen
                  ? 'text-white drop-shadow-[0_0_60px_rgba(255,255,255,0.3)]'
                  : 'bg-gradient-to-br from-indigo-600 to-violet-700 bg-clip-text text-transparent'
            } ${fullscreen ? 'text-[20rem] leading-none' : 'text-9xl'}`}
          >
            {overtime ? '+' : ''}
            {fmt(remaining)}
          </div>
          {!fullscreen && (
            <div className="mt-6 h-2 bg-white/40 rounded-full overflow-hidden backdrop-blur-md">
              <div
                className={`h-full transition-all duration-500 ${
                  overtime
                    ? 'bg-gradient-to-r from-red-400 to-rose-500'
                    : 'bg-gradient-to-r from-indigo-400 to-violet-500'
                }`}
                style={{ width: `${overtime ? 100 : progress * 100}%` }}
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          {running ? (
            <button
              onClick={pause}
              className="px-8 py-3.5 rounded-2xl font-semibold text-white border border-white/30 transition"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                boxShadow: '0 8px 24px -4px rgba(245, 158, 11, 0.4)',
              }}
            >
              ⏸ 일시정지
            </button>
          ) : (
            <button
              onClick={start}
              className="px-8 py-3.5 rounded-2xl font-semibold glass-btn-primary"
            >
              ▶ 시작
            </button>
          )}
          <button
            onClick={reset}
            className={`px-6 py-3.5 rounded-2xl font-semibold transition ${
              fullscreen
                ? 'border border-white/20 text-slate-300 hover:bg-white/10 backdrop-blur-md'
                : 'glass-btn text-slate-600'
            }`}
          >
            ↺ 리셋
          </button>
          {!fullscreen && (
            <button
              onClick={() => setFullscreen(true)}
              className="px-6 py-3.5 rounded-2xl font-semibold glass-btn text-slate-600"
            >
              ⛶ 전체화면
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
