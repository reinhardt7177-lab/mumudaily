import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 생기부 영역 기반 태그 (영역별 색상)
export const TAG_COLORS: Record<string, string> = {
  학습: 'from-indigo-100 to-violet-100 text-indigo-700 border-indigo-200',
  행동: 'from-amber-100 to-orange-100 text-amber-700 border-amber-200',
  관계: 'from-pink-100 to-rose-100 text-pink-700 border-pink-200',
  발표: 'from-sky-100 to-cyan-100 text-sky-700 border-sky-200',
  창의: 'from-fuchsia-100 to-pink-100 text-fuchsia-700 border-fuchsia-200',
  성실: 'from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200',
  체육: 'from-lime-100 to-green-100 text-lime-700 border-lime-200',
  예술: 'from-violet-100 to-purple-100 text-violet-700 border-violet-200',
  기타: 'from-slate-100 to-slate-200 text-slate-600 border-slate-200',
}

export const PRESET_TAGS = Object.keys(TAG_COLORS)

// 빠른 입력용 추천 어미
export const QUICK_PHRASES = [
  '잘함',
  '우수함',
  '꾸준함',
  '발전함',
  '도움 필요',
  '주도적',
  '성실함',
  '집중함',
  '협력함',
]

export type Memo = {
  id: string
  studentId: string
  content: string
  tags: string[]
  createdAt: number
}

type State = {
  memos: Memo[]
  add: (studentId: string, content: string, tags: string[]) => void
  update: (id: string, patch: Partial<Pick<Memo, 'content' | 'tags'>>) => void
  remove: (id: string) => void
  byStudent: (studentId: string) => Memo[]
  countByStudent: (studentId: string) => number
  recentByStudent: (studentId: string) => Memo | undefined
  searchByContent: (q: string) => Memo[]
}

const uid = () => Math.random().toString(36).slice(2, 10)

export const useMemos = create<State>()(
  persist(
    (set, get) => ({
      memos: [],
      add: (studentId, content, tags) => {
        if (!content.trim()) return
        set((s) => ({
          memos: [
            {
              id: uid(),
              studentId,
              content: content.trim(),
              tags,
              createdAt: Date.now(),
            },
            ...s.memos,
          ],
        }))
      },
      update: (id, patch) =>
        set((s) => ({
          memos: s.memos.map((m) =>
            m.id === id
              ? {
                  ...m,
                  ...patch,
                  content: patch.content?.trim() ?? m.content,
                }
              : m
          ),
        })),
      remove: (id) =>
        set((s) => ({ memos: s.memos.filter((m) => m.id !== id) })),
      byStudent: (studentId) =>
        get()
          .memos.filter((m) => m.studentId === studentId)
          .sort((a, b) => b.createdAt - a.createdAt),
      countByStudent: (studentId) =>
        get().memos.filter((m) => m.studentId === studentId).length,
      recentByStudent: (studentId) =>
        get()
          .memos.filter((m) => m.studentId === studentId)
          .sort((a, b) => b.createdAt - a.createdAt)[0],
      searchByContent: (q) => {
        const lower = q.trim().toLowerCase()
        if (!lower) return []
        return get().memos.filter(
          (m) =>
            m.content.toLowerCase().includes(lower) ||
            m.tags.some((t) => t.toLowerCase().includes(lower))
        )
      },
    }),
    { name: 'mumuapp-memos-v1' }
  )
)

export const fmtRelative = (ts: number): string => {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60_000)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}일 전`
  const date = new Date(ts)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

export const fmtFullDate = (ts: number): string => {
  const d = new Date(ts)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]}) ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
