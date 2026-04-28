import { useState } from 'react'
import { useStore, type Student } from '../store/students'

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type Mode = 'count' | 'size'

const groupColors = [
  'from-pink-100/70 to-rose-100/70 border-pink-200/60',
  'from-amber-100/70 to-orange-100/70 border-amber-200/60',
  'from-emerald-100/70 to-teal-100/70 border-emerald-200/60',
  'from-sky-100/70 to-cyan-100/70 border-sky-200/60',
  'from-violet-100/70 to-indigo-100/70 border-violet-200/60',
  'from-fuchsia-100/70 to-pink-100/70 border-fuchsia-200/60',
]

const labelColors = [
  'text-pink-600',
  'text-amber-600',
  'text-emerald-600',
  'text-sky-600',
  'text-violet-600',
  'text-fuchsia-600',
]

export default function Groups() {
  const students = useStore((s) => s.students)

  const [mode, setMode] = useState<Mode>('count')
  const [groupCount, setGroupCount] = useState(6)
  const [groupSize, setGroupSize] = useState(4)
  const [groups, setGroups] = useState<Student[][]>([])

  if (students.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold tracking-tight mb-4 bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">
          모둠 편성
        </h1>
        <div className="glass rounded-2xl py-20 text-center text-slate-400">
          먼저 <b>학생 명단</b>을 등록해 주세요.
        </div>
      </div>
    )
  }

  const make = () => {
    const shuffled = shuffle(students)
    const result: Student[][] = []

    if (mode === 'count') {
      const n = Math.max(1, Math.min(students.length, groupCount))
      for (let i = 0; i < n; i++) result.push([])
      shuffled.forEach((s, i) => result[i % n].push(s))
    } else {
      const size = Math.max(1, groupSize)
      for (let i = 0; i < shuffled.length; i += size) {
        result.push(shuffled.slice(i, i + size))
      }
    }
    setGroups(result)
  }

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-3xl font-bold tracking-tight mb-6 bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">
        모둠 자동 편성
      </h1>

      <div className="glass rounded-2xl p-5 mb-6">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('count')}
            className={`px-4 py-2 rounded-xl text-sm transition ${
              mode === 'count' ? 'glass-btn-primary' : 'glass-btn text-slate-600'
            }`}
          >
            모둠 개수 지정
          </button>
          <button
            onClick={() => setMode('size')}
            className={`px-4 py-2 rounded-xl text-sm transition ${
              mode === 'size' ? 'glass-btn-primary' : 'glass-btn text-slate-600'
            }`}
          >
            모둠당 인원 지정
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {mode === 'count' ? (
            <label className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">모둠 수</span>
              <input
                type="number"
                min={1}
                max={students.length}
                value={groupCount}
                onChange={(e) =>
                  setGroupCount(
                    Math.max(
                      1,
                      Math.min(students.length, Number(e.target.value))
                    )
                  )
                }
                className="w-20 px-2 py-1.5 rounded-lg glass-input text-center"
              />
              <span className="text-xs text-slate-400">
                ≈ 모둠당 {Math.ceil(students.length / Math.max(1, groupCount))}명
              </span>
            </label>
          ) : (
            <label className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">모둠당 인원</span>
              <input
                type="number"
                min={1}
                max={students.length}
                value={groupSize}
                onChange={(e) =>
                  setGroupSize(Math.max(1, Number(e.target.value)))
                }
                className="w-20 px-2 py-1.5 rounded-lg glass-input text-center"
              />
              <span className="text-xs text-slate-400">
                ≈ 모둠 {Math.ceil(students.length / Math.max(1, groupSize))}개
              </span>
            </label>
          )}

          <button
            onClick={make}
            className="ml-auto px-5 py-2.5 rounded-xl font-semibold glass-btn-primary"
          >
            🧩 모둠 편성
          </button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="glass rounded-2xl py-16 text-center text-slate-400">
          위 버튼을 눌러 모둠을 짜보세요.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {groups.map((g, i) => (
            <div
              key={i}
              className={`bg-gradient-to-br backdrop-blur-xl border rounded-2xl p-4 transition hover:scale-[1.02] ${
                groupColors[i % groupColors.length]
              }`}
              style={{
                boxShadow:
                  '0 1px 0 0 rgba(255,255,255,0.6) inset, 0 8px 24px -8px rgba(99, 102, 241, 0.12)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`text-sm font-bold tracking-tight ${
                    labelColors[i % labelColors.length]
                  }`}
                >
                  모둠 {i + 1}
                </div>
                <div className="text-xs text-slate-500 bg-white/60 px-2 py-0.5 rounded-full">
                  {g.length}명
                </div>
              </div>
              <div className="space-y-1">
                {g.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 text-sm py-1"
                  >
                    <span className="w-6 h-6 flex items-center justify-center text-[10px] font-bold text-slate-500 bg-white/60 rounded-md">
                      {s.number}
                    </span>
                    <span className="font-medium">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
