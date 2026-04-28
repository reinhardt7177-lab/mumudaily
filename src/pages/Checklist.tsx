import { useState } from 'react'
import { useStore } from '../store/students'

export default function Checklist() {
  const students = useStore((s) => s.students)
  const checklists = useStore((s) => s.checklists)
  const addChecklist = useStore((s) => s.addChecklist)
  const removeChecklist = useStore((s) => s.removeChecklist)
  const toggleCheck = useStore((s) => s.toggleCheck)
  const resetChecklist = useStore((s) => s.resetChecklist)

  const [title, setTitle] = useState('')
  const [activeId, setActiveId] = useState<string | null>(
    checklists[0]?.id ?? null
  )

  const active = checklists.find((c) => c.id === activeId) ?? checklists[0]

  const handleAdd = () => {
    if (!title.trim()) return
    addChecklist(title)
    setTitle('')
    setTimeout(() => {
      const first = useStore.getState().checklists[0]
      if (first) setActiveId(first.id)
    }, 0)
  }

  if (students.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold tracking-tight mb-4 bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">
          체크판
        </h1>
        <div className="glass rounded-2xl py-20 text-center text-slate-400">
          먼저 <b>학생 명단</b>을 등록해 주세요.
        </div>
      </div>
    )
  }

  const checkedCount = active
    ? Object.values(active.checked).filter(Boolean).length
    : 0
  const progress =
    students.length > 0 ? (checkedCount / students.length) * 100 : 0

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-3xl font-bold tracking-tight mb-6 bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">
        체크판
      </h1>

      <div className="flex gap-2 mb-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="새 체크리스트 (예: 동의서 제출)"
          className="flex-1 px-4 py-3 rounded-xl glass-input"
        />
        <button
          onClick={handleAdd}
          className="px-6 py-3 rounded-xl font-semibold glass-btn-primary"
        >
          추가
        </button>
      </div>

      {checklists.length === 0 ? (
        <div className="glass rounded-2xl py-16 text-center text-slate-400">
          체크리스트가 아직 없어요.
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {checklists.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm transition ${
                  active?.id === c.id
                    ? 'glass-btn-primary'
                    : 'glass-btn text-slate-600'
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>

          {active && (
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xl font-bold">{active.title}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-indigo-600">
                      {checkedCount}
                    </span>{' '}
                    / {students.length} 명 완료
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => resetChecklist(active.id)}
                    className="text-xs px-3 py-1.5 rounded-lg glass-btn"
                  >
                    초기화
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('이 체크리스트를 삭제할까요?'))
                        removeChecklist(active.id)
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg glass-btn text-red-500"
                  >
                    삭제
                  </button>
                </div>
              </div>

              <div className="h-1.5 bg-white/40 rounded-full overflow-hidden mb-5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {students.map((s) => {
                  const checked = !!active.checked[s.id]
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleCheck(active.id, s.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition text-left ${
                        checked
                          ? 'bg-gradient-to-br from-emerald-50/80 to-teal-50/80 backdrop-blur-md border-emerald-200/70'
                          : 'glass-soft hover:bg-white/60'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs transition ${
                          checked
                            ? 'bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-500 text-white'
                            : 'border-slate-300 bg-white/60'
                        }`}
                      >
                        {checked ? '✓' : ''}
                      </span>
                      <span className="w-7 text-[11px] font-bold text-slate-400">
                        {s.number}
                      </span>
                      <span className="text-sm flex-1 font-medium">
                        {s.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
