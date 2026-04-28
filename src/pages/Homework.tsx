import { useEffect, useState } from 'react'
import { useStore } from '../store/students'
import {
  cycleStatus,
  useHomework,
  type HomeworkStatus,
} from '../store/homework'

const statusMeta: Record<
  HomeworkStatus,
  { label: string; emoji: string; cardCls: string; badgeCls: string }
> = {
  done: {
    label: '완성',
    emoji: '✓',
    cardCls:
      'bg-gradient-to-br from-emerald-50/80 to-teal-50/80 border-emerald-200/70',
    badgeCls: 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white',
  },
  excellent: {
    label: '우수',
    emoji: '★',
    cardCls:
      'bg-gradient-to-br from-violet-50/80 to-indigo-50/80 border-violet-200/70',
    badgeCls: 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white',
  },
  partial: {
    label: '미완성',
    emoji: '△',
    cardCls:
      'bg-gradient-to-br from-amber-50/80 to-orange-50/80 border-amber-200/70',
    badgeCls: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white',
  },
  missing: {
    label: '미제출',
    emoji: '✕',
    cardCls:
      'bg-gradient-to-br from-rose-50/80 to-red-50/80 border-rose-200/70',
    badgeCls: 'bg-gradient-to-br from-rose-500 to-red-500 text-white',
  },
}

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

const fmtDue = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${m}/${d} (${days[date.getDay()]})`
}

export default function Homework() {
  const students = useStore((s) => s.students)
  const assignments = useHomework((s) => s.assignments)
  const addAssignment = useHomework((s) => s.addAssignment)
  const removeAssignment = useHomework((s) => s.removeAssignment)
  const setStatus = useHomework((s) => s.setStatus)
  const setMemo = useHomework((s) => s.setMemo)
  const getRecord = useHomework((s) => s.getRecord)
  const missCountByStudent = useHomework((s) => s.missCountByStudent)
  // subscribe to records so re-render happens on toggle
  useHomework((s) => s.records)

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [due, setDue] = useState(todayStr())
  const [desc, setDesc] = useState('')
  const [activeId, setActiveId] = useState<string | null>(
    assignments[0]?.id ?? null
  )
  const [memoOpen, setMemoOpen] = useState<{
    studentId: string
    initial: string
  } | null>(null)

  useEffect(() => {
    if (!activeId && assignments[0]) setActiveId(assignments[0].id)
  }, [assignments, activeId])

  if (students.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold tracking-tight mb-4 bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">
          숙제
        </h1>
        <div className="glass rounded-2xl py-20 text-center text-slate-400">
          먼저 <b>학생 명단</b>을 등록해 주세요.
        </div>
      </div>
    )
  }

  const active = assignments.find((a) => a.id === activeId) ?? assignments[0]

  const handleAdd = () => {
    if (!title.trim()) return
    addAssignment(title, due, desc)
    setTitle('')
    setDesc('')
    setDue(todayStr())
    setShowForm(false)
    setTimeout(() => {
      const first = useHomework.getState().assignments[0]
      if (first) setActiveId(first.id)
    }, 0)
  }

  const counts = active
    ? students.reduce(
        (acc, s) => {
          const r = getRecord(active.id, s.id)
          if (!r) acc.empty++
          else acc[r.status]++
          return acc
        },
        {
          empty: 0,
          done: 0,
          excellent: 0,
          partial: 0,
          missing: 0,
        }
      )
    : null

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">
          숙제
        </h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 rounded-xl font-semibold glass-btn-primary text-sm"
        >
          {showForm ? '취소' : '+ 새 숙제'}
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-2xl p-5 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="숙제 이름 (예: 수학 익힘책 30~31p)"
              className="sm:col-span-2 px-4 py-2.5 rounded-xl glass-input"
            />
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="px-4 py-2.5 rounded-xl glass-input"
            />
          </div>
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="설명 (선택)"
            className="w-full px-4 py-2.5 rounded-xl glass-input mb-2"
          />
          <button
            onClick={handleAdd}
            className="px-5 py-2 rounded-xl font-semibold glass-btn-primary text-sm"
          >
            추가
          </button>
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="glass rounded-2xl py-16 text-center text-slate-400">
          숙제가 아직 없어요. 위에서 추가해 주세요.
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {assignments.map((a) => (
              <button
                key={a.id}
                onClick={() => setActiveId(a.id)}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm transition ${
                  active?.id === a.id
                    ? 'glass-btn-primary'
                    : 'glass-btn text-slate-600'
                }`}
              >
                <div className="font-semibold">{a.title}</div>
                <div className="text-[10px] opacity-80">{fmtDue(a.dueDate)}</div>
              </button>
            ))}
          </div>

          {active && counts && (
            <>
              <div className="glass rounded-2xl p-5 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xl font-bold">{active.title}</div>
                    {active.description && (
                      <div className="text-sm text-slate-500 mt-0.5">
                        {active.description}
                      </div>
                    )}
                    <div className="text-xs text-slate-400 mt-1">
                      마감: {fmtDue(active.dueDate)}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('이 숙제를 삭제할까요? 기록도 함께 사라집니다.'))
                        removeAssignment(active.id)
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg glass-btn text-red-500"
                  >
                    삭제
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <Pill
                    color="bg-slate-200 text-slate-600"
                    label="미체크"
                    n={counts.empty}
                  />
                  <Pill
                    color={statusMeta.done.badgeCls}
                    label="완성"
                    n={counts.done}
                  />
                  <Pill
                    color={statusMeta.excellent.badgeCls}
                    label="우수"
                    n={counts.excellent}
                  />
                  <Pill
                    color={statusMeta.partial.badgeCls}
                    label="미완성"
                    n={counts.partial}
                  />
                  <Pill
                    color={statusMeta.missing.badgeCls}
                    label="미제출"
                    n={counts.missing}
                  />
                </div>

                <div className="mt-3 text-[11px] text-slate-400">
                  학생 카드를 탭하면 상태가 순환합니다: 완성 → 우수 → 미완성 → 미제출 → 미체크. 길게 누르면 메모.
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {students.map((s) => {
                  const r = getRecord(active.id, s.id)
                  const meta = r ? statusMeta[r.status] : null
                  const miss = missCountByStudent(s.id, 14)
                  return (
                    <StudentCard
                      key={s.id}
                      number={s.number}
                      name={s.name}
                      meta={meta}
                      memo={r?.memo}
                      missCount={miss}
                      onTap={() => {
                        const next = cycleStatus(r?.status)
                        setStatus(active.id, s.id, next)
                      }}
                      onLongPress={() =>
                        setMemoOpen({ studentId: s.id, initial: r?.memo ?? '' })
                      }
                    />
                  )
                })}
              </div>
            </>
          )}
        </>
      )}

      {memoOpen && active && (
        <MemoModal
          initial={memoOpen.initial}
          studentName={
            students.find((s) => s.id === memoOpen.studentId)?.name ?? ''
          }
          onCancel={() => setMemoOpen(null)}
          onSave={(memo) => {
            setMemo(active.id, memoOpen.studentId, memo)
            setMemoOpen(null)
          }}
        />
      )}
    </div>
  )
}

function Pill({
  color,
  label,
  n,
}: {
  color: string
  label: string
  n: number
}) {
  return (
    <span
      className={`px-2.5 py-1 rounded-full font-semibold ${color} flex items-center gap-1.5`}
    >
      <span>{label}</span>
      <span className="opacity-80">{n}</span>
    </span>
  )
}

function StudentCard({
  number,
  name,
  meta,
  memo,
  missCount,
  onTap,
  onLongPress,
}: {
  number: number
  name: string
  meta: { label: string; emoji: string; cardCls: string; badgeCls: string } | null
  memo?: string
  missCount: number
  onTap: () => void
  onLongPress: () => void
}) {
  const handlers = useLongPress(onLongPress, onTap)
  return (
    <button
      {...handlers}
      className={`relative flex items-center gap-2 px-3 py-3 rounded-xl border backdrop-blur-md transition text-left ${
        meta ? meta.cardCls : 'glass-soft'
      }`}
    >
      <span
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
          meta ? meta.badgeCls : 'bg-white/60 text-slate-400'
        }`}
      >
        {meta ? meta.emoji : ''}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400">{number}</span>
          <span className="text-sm font-semibold truncate">{name}</span>
        </div>
        <div className="text-[10px] text-slate-500 truncate">
          {meta ? meta.label : '미체크'}
          {memo ? ` · ${memo}` : ''}
        </div>
      </div>
      {missCount >= 2 && (
        <span
          className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-bold rounded-full shadow-sm"
          title={`최근 14일 미완성/미제출 ${missCount}회`}
        >
          ⚠ {missCount}
        </span>
      )}
    </button>
  )
}

function useLongPress(onLong: () => void, onShort: () => void) {
  let timer: number | null = null
  let triggered = false
  const start = () => {
    triggered = false
    timer = window.setTimeout(() => {
      triggered = true
      onLong()
    }, 500)
  }
  const cancel = () => {
    if (timer) window.clearTimeout(timer)
    timer = null
  }
  const end = () => {
    if (timer) {
      window.clearTimeout(timer)
      timer = null
      if (!triggered) onShort()
    }
  }
  return {
    onMouseDown: start,
    onMouseUp: end,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: end,
    onTouchCancel: cancel,
  }
}

function MemoModal({
  studentName,
  initial,
  onCancel,
  onSave,
}: {
  studentName: string
  initial: string
  onCancel: () => void
  onSave: (memo: string) => void
}) {
  const [val, setVal] = useState(initial)
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="glass-strong rounded-3xl w-full max-w-md mx-4 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-xs text-slate-400 mb-1">메모</div>
        <div className="text-lg font-bold mb-3">{studentName}</div>
        <textarea
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          rows={4}
          placeholder="예: 다음에 다시 확인 / 글씨 흐림 / 풀이 과정 부족"
          className="w-full px-3 py-2 rounded-xl glass-input text-sm"
        />
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl glass-btn text-sm"
          >
            취소
          </button>
          <button
            onClick={() => onSave(val)}
            className="px-4 py-2 rounded-xl glass-btn-primary text-sm font-semibold"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
