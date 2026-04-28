import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/students'
import {
  PRESET_TAGS,
  QUICK_PHRASES,
  TAG_COLORS,
  fmtFullDate,
  fmtRelative,
  useMemos,
  type Memo,
} from '../store/memos'

type SortMode = 'roster' | 'recent' | 'inactive'

export default function Memos() {
  const students = useStore((s) => s.students)
  const memos = useMemos((s) => s.memos)
  const [openStudentId, setOpenStudentId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('roster')
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [quickMode, setQuickMode] = useState(false)

  if (students.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold tracking-tight mb-4 bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">
          관찰 메모
        </h1>
        <div className="glass rounded-2xl py-20 text-center text-slate-400">
          먼저 <b>학생 명단</b>을 등록해 주세요.
        </div>
      </div>
    )
  }

  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    const last: Record<string, number> = {}
    const tags: Record<string, Set<string>> = {}
    for (const m of memos) {
      map[m.studentId] = (map[m.studentId] ?? 0) + 1
      if (!last[m.studentId] || m.createdAt > last[m.studentId])
        last[m.studentId] = m.createdAt
      tags[m.studentId] ??= new Set()
      m.tags.forEach((t) => tags[m.studentId].add(t))
    }
    return { map, last, tags }
  }, [memos])

  const visibleStudents = useMemo(() => {
    let list = [...students]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          memos.some(
            (m) =>
              m.studentId === s.id && m.content.toLowerCase().includes(q)
          )
      )
    }
    if (filterTag) {
      list = list.filter((s) => counts.tags[s.id]?.has(filterTag))
    }
    if (sort === 'recent') {
      list.sort((a, b) => (counts.last[b.id] ?? 0) - (counts.last[a.id] ?? 0))
    } else if (sort === 'inactive') {
      list.sort((a, b) => (counts.last[a.id] ?? 0) - (counts.last[b.id] ?? 0))
    } else {
      list.sort((a, b) => a.number - b.number)
    }
    return list
  }, [students, memos, search, sort, filterTag, counts])

  const totalMemos = memos.length
  const studentsWithMemo = Object.keys(counts.map).length
  const coverage = students.length
    ? Math.round((studentsWithMemo / students.length) * 100)
    : 0

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-400">
            Phase 2 · 학생별 누적
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">
            관찰 메모
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setQuickMode((v) => !v)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              quickMode ? 'glass-btn-primary' : 'glass-btn'
            }`}
          >
            ⚡ 빠른 입력
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름 또는 메모 내용 검색"
          className="flex-1 min-w-[200px] px-4 py-2 rounded-xl glass-input text-sm"
        />
        <div className="flex gap-1">
          <SortBtn cur={sort} v="roster" set={setSort}>
            번호순
          </SortBtn>
          <SortBtn cur={sort} v="recent" set={setSort}>
            최근 메모
          </SortBtn>
          <SortBtn cur={sort} v="inactive" set={setSort}>
            장기간 미작성
          </SortBtn>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 mb-4">
        <button
          onClick={() => setFilterTag(null)}
          className={`px-2.5 py-1 rounded-full text-xs transition ${
            filterTag === null
              ? 'glass-btn-primary'
              : 'glass-btn text-slate-600'
          }`}
        >
          전체
        </button>
        {PRESET_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setFilterTag(filterTag === tag ? null : tag)}
            className={`px-2.5 py-1 rounded-full text-xs border transition ${
              filterTag === tag
                ? `bg-gradient-to-br ${TAG_COLORS[tag]} font-bold`
                : 'glass-btn text-slate-500'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="glass-soft rounded-xl px-4 py-2.5 mb-4 flex flex-wrap items-center gap-4 text-xs">
        <span>
          전체 메모 <b className="text-slate-700">{totalMemos}</b>
        </span>
        <span>
          작성된 학생{' '}
          <b className="text-slate-700">
            {studentsWithMemo} / {students.length}
          </b>{' '}
          ({coverage}%)
        </span>
        {coverage < 100 && (
          <span className="text-amber-600">
            ⚠ {students.length - studentsWithMemo}명 미작성
          </span>
        )}
      </div>

      {quickMode ? (
        <QuickCapture
          onClose={() => setQuickMode(false)}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {visibleStudents.map((s) => {
            const count = counts.map[s.id] ?? 0
            const lastTs = counts.last[s.id]
            const lastMemo = lastTs
              ? memos.find(
                  (m) => m.studentId === s.id && m.createdAt === lastTs
                )
              : undefined
            const stale = lastTs
              ? Date.now() - lastTs > 14 * 24 * 60 * 60 * 1000
              : true
            return (
              <button
                key={s.id}
                onClick={() => setOpenStudentId(s.id)}
                className="text-left glass-soft hover:bg-white/70 rounded-xl p-3 transition relative"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400">
                      {s.number}
                    </span>
                    <span className="font-semibold text-sm">{s.name}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      count === 0
                        ? 'bg-rose-100 text-rose-600'
                        : count >= 5
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </div>
                {lastMemo ? (
                  <div className="text-xs text-slate-500 line-clamp-2 min-h-[2.5em]">
                    {lastMemo.content}
                  </div>
                ) : (
                  <div className="text-xs text-slate-300 min-h-[2.5em]">
                    메모 없음
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-wrap gap-0.5">
                    {lastMemo?.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className={`text-[9px] px-1.5 py-0.5 rounded-full bg-gradient-to-br ${TAG_COLORS[t] ?? TAG_COLORS.기타}`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <span
                    className={`text-[10px] ${stale ? 'text-rose-400' : 'text-slate-400'}`}
                  >
                    {lastTs ? fmtRelative(lastTs) : ''}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {openStudentId && (
        <StudentDrawer
          studentId={openStudentId}
          onClose={() => setOpenStudentId(null)}
        />
      )}
    </div>
  )
}

function SortBtn({
  cur,
  v,
  set,
  children,
}: {
  cur: SortMode
  v: SortMode
  set: (s: SortMode) => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={() => set(v)}
      className={`px-3 py-1.5 rounded-lg text-xs transition ${
        cur === v ? 'glass-btn-primary' : 'glass-btn text-slate-600'
      }`}
    >
      {children}
    </button>
  )
}

function StudentDrawer({
  studentId,
  onClose,
}: {
  studentId: string
  onClose: () => void
}) {
  const student = useStore((s) =>
    s.students.find((x) => x.id === studentId)
  )
  const byStudent = useMemos((s) => s.byStudent)
  const add = useMemos((s) => s.add)
  const update = useMemos((s) => s.update)
  const remove = useMemos((s) => s.remove)
  // re-render on memo changes
  useMemos((s) => s.memos)

  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  if (!student) return null
  const list = byStudent(studentId)

  const toggleTag = (t: string) => {
    setTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))
  }

  const handleSubmit = () => {
    if (!content.trim()) return
    add(studentId, content, tags)
    setContent('')
    setTags([])
    inputRef.current?.focus()
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-stretch justify-end bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-strong w-full max-w-xl h-full overflow-auto rounded-l-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs text-slate-400">{student.number}번</div>
          <div className="flex items-center gap-2">
            <Link
              to={`/student/${student.id}`}
              className="text-xs text-indigo-600 hover:underline"
              onClick={onClose}
            >
              전체 보기 →
            </Link>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 text-sm"
            >
              ✕
            </button>
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-4">{student.name}</h2>

        <div className="glass rounded-2xl p-4 mb-4">
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
            }}
            placeholder="관찰 내용 (Cmd+Enter 저장)"
            rows={3}
            className="w-full px-3 py-2 rounded-xl glass-input text-sm resize-none mb-2"
          />

          <div className="flex flex-wrap gap-1 mb-2">
            {QUICK_PHRASES.map((p) => (
              <button
                key={p}
                onClick={() =>
                  setContent((c) => (c ? `${c} ${p}` : p))
                }
                className="text-[10px] px-2 py-0.5 rounded-full bg-white/60 hover:bg-white text-slate-500 border border-white/70"
              >
                + {p}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1 mb-3">
            {PRESET_TAGS.map((t) => (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className={`px-2 py-0.5 rounded-full text-[11px] border transition ${
                  tags.includes(t)
                    ? `bg-gradient-to-br ${TAG_COLORS[t]} font-semibold`
                    : 'bg-white/40 text-slate-500 border-white/60 hover:bg-white/70'
                }`}
              >
                #{t}
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className="w-full py-2.5 rounded-xl font-semibold glass-btn-primary text-sm disabled:opacity-40"
          >
            메모 추가
          </button>
        </div>

        <div className="text-xs text-slate-400 mb-2">
          누적 메모 <b className="text-slate-700">{list.length}</b>개
        </div>

        {list.length === 0 ? (
          <div className="glass rounded-2xl py-12 text-center text-slate-400 text-sm">
            아직 메모가 없어요. 위에서 추가해 보세요.
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((m) => (
              <MemoItem
                key={m.id}
                memo={m}
                editing={editing === m.id}
                editContent={editContent}
                onEdit={() => {
                  setEditing(m.id)
                  setEditContent(m.content)
                }}
                onCancel={() => setEditing(null)}
                onSave={() => {
                  if (editContent.trim()) {
                    update(m.id, { content: editContent })
                  }
                  setEditing(null)
                }}
                onChange={setEditContent}
                onRemove={() => {
                  if (confirm('삭제할까요?')) remove(m.id)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MemoItem({
  memo,
  editing,
  editContent,
  onEdit,
  onCancel,
  onSave,
  onChange,
  onRemove,
}: {
  memo: Memo
  editing: boolean
  editContent: string
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  onChange: (v: string) => void
  onRemove: () => void
}) {
  return (
    <div className="glass rounded-2xl p-4 group">
      <div className="flex items-start justify-between mb-2">
        <div className="flex flex-wrap gap-1">
          {memo.tags.map((t) => (
            <span
              key={t}
              className={`px-2 py-0.5 rounded-full text-[10px] bg-gradient-to-br ${TAG_COLORS[t] ?? TAG_COLORS.기타}`}
            >
              {t}
            </span>
          ))}
        </div>
        <div className="text-[10px] text-slate-400" title={fmtFullDate(memo.createdAt)}>
          {fmtRelative(memo.createdAt)}
        </div>
      </div>
      {editing ? (
        <div>
          <textarea
            value={editContent}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-xl glass-input text-sm resize-none mb-2"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg glass-btn text-xs"
            >
              취소
            </button>
            <button
              onClick={onSave}
              className="px-3 py-1.5 rounded-lg glass-btn-primary text-xs font-semibold"
            >
              저장
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-sm whitespace-pre-wrap">{memo.content}</div>
          <div className="flex justify-end gap-2 mt-1 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={onEdit}
              className="text-[11px] text-slate-400 hover:text-indigo-600"
            >
              편집
            </button>
            <button
              onClick={onRemove}
              className="text-[11px] text-slate-400 hover:text-red-500"
            >
              삭제
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function QuickCapture({ onClose }: { onClose: () => void }) {
  const students = useStore((s) => s.students)
  const add = useMemos((s) => s.add)
  // re-render on add
  useMemos((s) => s.memos)

  const [studentId, setStudentId] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [recent, setRecent] = useState<
    { studentName: string; content: string }[]
  >([])

  const toggleTag = (t: string) => {
    setTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))
  }

  const handleSubmit = () => {
    if (!studentId || !content.trim()) return
    const student = students.find((s) => s.id === studentId)!
    add(studentId, content, tags)
    setRecent((r) =>
      [{ studentName: student.name, content: content.trim() }, ...r].slice(0, 5)
    )
    setContent('')
    setTags([])
  }

  return (
    <div className="glass-strong rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-400">
            Quick Capture
          </div>
          <div className="text-lg font-bold">빠른 입력 모드</div>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-700"
        >
          ✕ 닫기
        </button>
      </div>

      <div className="text-xs text-slate-500 mb-2">학생을 먼저 선택하세요</div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 mb-4">
        {students.map((s) => (
          <button
            key={s.id}
            onClick={() => setStudentId(s.id)}
            className={`px-2 py-2 rounded-lg text-xs transition ${
              studentId === s.id
                ? 'glass-btn-primary'
                : 'glass-btn text-slate-600'
            }`}
          >
            <div className="text-[9px] font-bold opacity-60">{s.number}</div>
            <div className="font-semibold truncate">{s.name}</div>
          </button>
        ))}
      </div>

      {studentId && (
        <div className="glass rounded-2xl p-4">
          <div className="text-xs text-slate-500 mb-1">
            {students.find((s) => s.id === studentId)?.name}에게 메모
          </div>
          <input
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && content.trim()) handleSubmit()
            }}
            placeholder="한 줄 메모 (Enter 저장)"
            className="w-full px-3 py-2.5 rounded-xl glass-input text-sm mb-2"
          />
          <div className="flex flex-wrap gap-1 mb-2">
            {PRESET_TAGS.map((t) => (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className={`px-2 py-0.5 rounded-full text-[11px] border transition ${
                  tags.includes(t)
                    ? `bg-gradient-to-br ${TAG_COLORS[t]} font-semibold`
                    : 'bg-white/40 text-slate-500 border-white/60'
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className="w-full py-2 rounded-xl font-semibold glass-btn-primary text-sm disabled:opacity-40"
          >
            저장 + 다음
          </button>
        </div>
      )}

      {recent.length > 0 && (
        <div className="mt-4">
          <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
            방금 저장됨
          </div>
          <div className="space-y-1">
            {recent.map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs glass-soft rounded-lg px-3 py-2"
              >
                <span className="font-bold text-indigo-600">
                  {r.studentName}
                </span>
                <span className="text-slate-600 truncate">{r.content}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
