import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/students'

export default function Picker() {
  const students = useStore((s) => s.students)

  const [picked, setPicked] = useState<string | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [avoidRecent, setAvoidRecent] = useState(true)
  const [count, setCount] = useState(1)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  if (students.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold tracking-tight mb-4 bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">
          뽑기
        </h1>
        <div className="glass rounded-2xl py-20 text-center text-slate-400">
          먼저 <b>학생 명단</b>을 등록해 주세요.
        </div>
      </div>
    )
  }

  const pickOne = (): string => {
    const recentSet = new Set(history.slice(0, 5))
    const pool = avoidRecent
      ? students.filter((s) => !recentSet.has(s.name))
      : students
    const candidates = pool.length > 0 ? pool : students
    const idx = Math.floor(Math.random() * candidates.length)
    return candidates[idx].name
  }

  const spin = () => {
    if (spinning) return
    setSpinning(true)
    let elapsed = 0
    const total = 1500
    const tick = 60
    intervalRef.current = window.setInterval(() => {
      elapsed += tick
      setPicked(students[Math.floor(Math.random() * students.length)].name)
      if (elapsed >= total) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        const finals: string[] = []
        const used = new Set<string>()
        for (let i = 0; i < count; i++) {
          let n = pickOne()
          let tries = 0
          while (used.has(n) && tries < 50) {
            n = pickOne()
            tries++
          }
          used.add(n)
          finals.push(n)
        }
        const result = finals.join(', ')
        setPicked(result)
        setHistory((h) => [...finals, ...h].slice(0, 20))
        setSpinning(false)
      }
    }, tick)
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight mb-6 bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">
        뽑기 / 발표자 룰렛
      </h1>

      <div className="glass rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">인원</span>
          <input
            type="number"
            min={1}
            max={students.length}
            value={count}
            onChange={(e) =>
              setCount(
                Math.max(1, Math.min(students.length, Number(e.target.value)))
              )
            }
            className="w-16 px-2 py-1.5 rounded-lg glass-input text-center"
          />
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={avoidRecent}
            onChange={(e) => setAvoidRecent(e.target.checked)}
            className="w-4 h-4 accent-indigo-500"
          />
          <span className="text-slate-500">최근 5명 제외</span>
        </label>
      </div>

      <div className="glass-strong rounded-3xl p-12 mb-6 text-center min-h-[280px] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/30 via-transparent to-pink-100/30 pointer-events-none" />
        {picked ? (
          <div
            className={`relative text-6xl font-black tracking-tight transition-all ${
              spinning
                ? 'text-slate-300 blur-[1px]'
                : 'bg-gradient-to-br from-indigo-600 to-violet-600 bg-clip-text text-transparent'
            }`}
          >
            {picked}
          </div>
        ) : (
          <div className="relative text-slate-300 text-2xl">
            아래 버튼을 눌러보세요
          </div>
        )}
      </div>

      <button
        onClick={spin}
        disabled={spinning}
        className="w-full py-5 rounded-2xl text-lg font-bold glass-btn-primary disabled:opacity-50"
      >
        {spinning ? '뽑는 중…' : '🎯 뽑기'}
      </button>

      {history.length > 0 && (
        <div className="mt-8">
          <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
            Recent
          </div>
          <div className="flex flex-wrap gap-1.5">
            {history.map((n, i) => (
              <span
                key={i}
                className={`px-3 py-1 rounded-full text-xs backdrop-blur-md border ${
                  i < 5
                    ? 'bg-indigo-100/70 border-indigo-200/50 text-indigo-700 font-semibold'
                    : 'bg-white/40 border-white/60 text-slate-500'
                }`}
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
