import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store/students'
import {
  TAG_COLORS,
  fmtFullDate,
  fmtRelative,
  useMemos,
} from '../store/memos'
import { useHomework, type HomeworkStatus } from '../store/homework'

const statusMeta: Record<
  HomeworkStatus,
  { label: string; emoji: string; cls: string }
> = {
  done: {
    label: '완성',
    emoji: '✓',
    cls: 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white',
  },
  excellent: {
    label: '우수',
    emoji: '★',
    cls: 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white',
  },
  partial: {
    label: '미완성',
    emoji: '△',
    cls: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white',
  },
  missing: {
    label: '미제출',
    emoji: '✕',
    cls: 'bg-gradient-to-br from-rose-500 to-red-500 text-white',
  },
}

const fmtDue = (ymd: string) => {
  const [, m, d] = ymd.split('-').map(Number)
  return `${m}/${d}`
}

export default function Student() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const students = useStore((s) => s.students)
  const checklists = useStore((s) => s.checklists)

  const memos = useMemos((s) => s.memos)
  const addMemo = useMemos((s) => s.add)
  const removeMemo = useMemos((s) => s.remove)

  const assignments = useHomework((s) => s.assignments)
  const records = useHomework((s) => s.records)

  const [quickContent, setQuickContent] = useState('')

  const student = students.find((s) => s.id === id)
  const idx = students.findIndex((s) => s.id === id)
  const prev = idx > 0 ? students[idx - 1] : null
  const next = idx >= 0 && idx < students.length - 1 ? students[idx + 1] : null

  const studentMemos = useMemo(
    () =>
      memos
        .filter((m) => m.studentId === id)
        .sort((a, b) => b.createdAt - a.createdAt),
    [memos, id]
  )

  const tagCounts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const memo of studentMemos)
      for (const t of memo.tags) m[t] = (m[t] ?? 0) + 1
    return m
  }, [studentMemos])

  const studentHomework = useMemo(() => {
    return assignments
      .map((a) => {
        const r = records.find(
          (x) => x.assignmentId === a.id && x.studentId === id
        )
        return { assignment: a, record: r }
      })
      .sort(
        (a, b) =>
          (b.assignment.createdAt ?? 0) - (a.assignment.createdAt ?? 0)
      )
  }, [assignments, records, id])

  const homeworkStats = useMemo(() => {
    const total = studentHomework.length
    const done = studentHomework.filter(
      (h) => h.record?.status === 'done' || h.record?.status === 'excellent'
    ).length
    const missing = studentHomework.filter(
      (h) => h.record?.status === 'missing'
    ).length
    const partial = studentHomework.filter(
      (h) => h.record?.status === 'partial'
    ).length
    const pending = studentHomework.filter((h) => !h.record).length
    return { total, done, missing, partial, pending }
  }, [studentHomework])

  const studentChecks = useMemo(() => {
    return checklists.map((c) => ({
      id: c.id,
      title: c.title,
      checked: !!c.checked[id ?? ''],
    }))
  }, [checklists, id])

  if (!student) {
    return (
      <div className="p-6">
        <div className="glass rounded-2xl p-12 text-center">
          <div className="text-slate-400 mb-3">학생을 찾을 수 없어요.</div>
          <Link
            to="/roster"
            className="text-indigo-600 underline text-sm"
          >
            학생 명단으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const handleQuickAdd = (tags: string[] = []) => {
    if (!quickContent.trim()) return
    addMemo(student.id, quickContent, tags)
    setQuickContent('')
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-2 mb-4 text-sm">
        <Link
          to="/roster"
          className="text-slate-400 hover:text-indigo-600 transition"
        >
          ← 학생 명단
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => prev && navigate(`/student/${prev.id}`)}
            disabled={!prev}
            className="px-3 py-1.5 rounded-lg glass-btn text-xs disabled:opacity-30"
          >
            ← {prev?.name ?? ''}
          </button>
          <button
            onClick={() => next && navigate(`/student/${next.id}`)}
            disabled={!next}
            className="px-3 py-1.5 rounded-lg glass-btn text-xs disabled:opacity-30"
          >
            {next?.name ?? ''} →
          </button>
        </div>
      </div>

      <div className="glass-strong rounded-3xl p-6 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-slate-400 mb-1">
              {idx + 1} / {students.length}번
            </div>
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">
              {student.name}
            </h1>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="메모" n={studentMemos.length} accent="indigo" />
            <Stat
              label="숙제 완성"
              n={homeworkStats.done}
              total={homeworkStats.total}
              accent="emerald"
            />
            <Stat
              label="체크 완료"
              n={studentChecks.filter((c) => c.checked).length}
              total={studentChecks.length}
              accent="sky"
            />
          </div>
        </div>

        {Object.keys(tagCounts).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {Object.entries(tagCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([tag, n]) => (
                <span
                  key={tag}
                  className={`px-2.5 py-1 rounded-full text-xs bg-gradient-to-br ${TAG_COLORS[tag] ?? TAG_COLORS.기타} font-semibold flex items-center gap-1`}
                >
                  <span>{tag}</span>
                  <span className="opacity-70">{n}</span>
                </span>
              ))}
          </div>
        )}

        {homeworkStats.missing + homeworkStats.partial >= 2 && (
          <div className="mt-3 px-3 py-2 rounded-xl bg-rose-50/70 border border-rose-200/60 text-xs text-rose-700">
            ⚠️ 최근 숙제 미완성·미제출 {homeworkStats.missing + homeworkStats.partial}회
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 관찰 메모 */}
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-400">
                Notes
              </div>
              <div className="text-lg font-bold">관찰 메모</div>
            </div>
            <Link
              to="/memos"
              className="text-xs text-slate-400 hover:text-indigo-600"
            >
              전체 →
            </Link>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              value={quickContent}
              onChange={(e) => setQuickContent(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
              placeholder="빠른 메모 (Enter 저장)"
              className="flex-1 px-3 py-2 rounded-xl glass-input text-sm"
            />
            <button
              onClick={() => handleQuickAdd()}
              disabled={!quickContent.trim()}
              className="px-4 py-2 rounded-xl glass-btn-primary text-sm font-semibold disabled:opacity-40"
            >
              추가
            </button>
          </div>

          {studentMemos.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-10">
              메모가 없어요.
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-auto pr-1">
              {studentMemos.map((m) => (
                <div
                  key={m.id}
                  className="glass-soft rounded-xl px-4 py-3 group"
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex flex-wrap gap-1">
                      {m.tags.map((t) => (
                        <span
                          key={t}
                          className={`px-2 py-0.5 rounded-full text-[10px] bg-gradient-to-br ${TAG_COLORS[t] ?? TAG_COLORS.기타}`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <span
                      className="text-[10px] text-slate-400 shrink-0"
                      title={fmtFullDate(m.createdAt)}
                    >
                      {fmtRelative(m.createdAt)}
                    </span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {m.content}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('삭제할까요?')) removeMemo(m.id)
                    }}
                    className="mt-1 text-[10px] text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 숙제 + 체크판 */}
        <div className="space-y-4">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-400">
                  Homework
                </div>
                <div className="text-lg font-bold">숙제</div>
              </div>
              <Link
                to="/homework"
                className="text-xs text-slate-400 hover:text-indigo-600"
              >
                관리 →
              </Link>
            </div>

            <div className="grid grid-cols-4 gap-1 mb-3 text-[10px]">
              <Mini label="완성" n={homeworkStats.done} cls="bg-emerald-100 text-emerald-700" />
              <Mini label="미완성" n={homeworkStats.partial} cls="bg-amber-100 text-amber-700" />
              <Mini label="미제출" n={homeworkStats.missing} cls="bg-rose-100 text-rose-700" />
              <Mini label="미체크" n={homeworkStats.pending} cls="bg-slate-100 text-slate-600" />
            </div>

            {studentHomework.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">
                숙제가 아직 없어요.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-auto pr-1">
                {studentHomework.slice(0, 12).map((h) => (
                  <div
                    key={h.assignment.id}
                    className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg bg-white/40"
                  >
                    {h.record ? (
                      <span
                        className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${statusMeta[h.record.status].cls}`}
                      >
                        {statusMeta[h.record.status].emoji}
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded border border-slate-300" />
                    )}
                    <span className="flex-1 truncate">
                      {h.assignment.title}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {fmtDue(h.assignment.dueDate)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-400">
                  Checks
                </div>
                <div className="text-lg font-bold">체크판</div>
              </div>
              <Link
                to="/checklist"
                className="text-xs text-slate-400 hover:text-indigo-600"
              >
                관리 →
              </Link>
            </div>

            {studentChecks.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">
                체크리스트가 없어요.
              </div>
            ) : (
              <div className="space-y-1.5">
                {studentChecks.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg bg-white/40"
                  >
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center text-[10px] ${
                        c.checked
                          ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white'
                          : 'border border-slate-300 bg-white/60'
                      }`}
                    >
                      {c.checked ? '✓' : ''}
                    </span>
                    <span className="flex-1 truncate">{c.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Phase 4 placeholder */}
      <div className="mt-4 glass-soft rounded-2xl p-5 border-2 border-dashed border-indigo-200/60">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">✨</span>
          <span className="text-xs uppercase tracking-widest text-indigo-400 font-bold">
            Coming Soon · Phase 4
          </span>
        </div>
        <div className="text-sm font-semibold text-indigo-700 mb-1">
          AI 생기부 초안 자동 생성
        </div>
        <div className="text-xs text-slate-500">
          누적된 메모 {studentMemos.length}개 + 숙제 기록 {studentHomework.filter((h) => h.record).length}개 → 영역별 생기부 문장 초안 자동 작성
        </div>
      </div>
    </div>
  )
}

function Stat({
  label,
  n,
  total,
  accent,
}: {
  label: string
  n: number
  total?: number
  accent: 'indigo' | 'emerald' | 'sky'
}) {
  const grad = {
    indigo: 'from-indigo-600 to-violet-700',
    emerald: 'from-emerald-500 to-teal-600',
    sky: 'from-sky-500 to-cyan-600',
  }[accent]
  return (
    <div className="px-3 py-2 rounded-xl bg-white/40 backdrop-blur-md border border-white/60 text-center min-w-[80px]">
      <div className="text-[10px] text-slate-500 uppercase tracking-wide">
        {label}
      </div>
      <div
        className={`text-2xl font-black tabular-nums bg-gradient-to-br ${grad} bg-clip-text text-transparent`}
      >
        {n}
        {total !== undefined && (
          <span className="text-xs text-slate-400">/{total}</span>
        )}
      </div>
    </div>
  )
}

function Mini({
  label,
  n,
  cls,
}: {
  label: string
  n: number
  cls: string
}) {
  return (
    <div className={`px-2 py-1.5 rounded-lg text-center ${cls}`}>
      <div className="font-bold text-sm tabular-nums">{n}</div>
      <div className="text-[9px] opacity-80">{label}</div>
    </div>
  )
}

