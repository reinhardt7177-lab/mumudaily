import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type HomeworkStatus = 'done' | 'excellent' | 'partial' | 'missing'

// tap order: empty → done → excellent → partial → missing → empty
export const cycleStatus = (
  s: HomeworkStatus | undefined
): HomeworkStatus | undefined => {
  switch (s) {
    case undefined:
      return 'done'
    case 'done':
      return 'excellent'
    case 'excellent':
      return 'partial'
    case 'partial':
      return 'missing'
    case 'missing':
      return undefined
  }
}

export type HomeworkAssignment = {
  id: string
  title: string
  dueDate: string // YYYY-MM-DD
  createdAt: number
  description?: string
}

export type HomeworkRecord = {
  assignmentId: string
  studentId: string
  status: HomeworkStatus
  memo?: string
  checkedAt: number
}

type State = {
  assignments: HomeworkAssignment[]
  records: HomeworkRecord[]
  addAssignment: (title: string, dueDate: string, description?: string) => void
  removeAssignment: (id: string) => void
  setStatus: (
    assignmentId: string,
    studentId: string,
    status: HomeworkStatus | undefined
  ) => void
  setMemo: (assignmentId: string, studentId: string, memo: string) => void
  getRecord: (
    assignmentId: string,
    studentId: string
  ) => HomeworkRecord | undefined
  missCountByStudent: (studentId: string, days?: number) => number
}

const uid = () => Math.random().toString(36).slice(2, 10)
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

export const useHomework = create<State>()(
  persist(
    (set, get) => ({
      assignments: [],
      records: [],
      addAssignment: (title, dueDate, description) =>
        set((s) => ({
          assignments: [
            {
              id: uid(),
              title: title.trim() || '숙제',
              dueDate: dueDate || today(),
              description: description?.trim() || undefined,
              createdAt: Date.now(),
            },
            ...s.assignments,
          ],
        })),
      removeAssignment: (id) =>
        set((s) => ({
          assignments: s.assignments.filter((a) => a.id !== id),
          records: s.records.filter((r) => r.assignmentId !== id),
        })),
      setStatus: (assignmentId, studentId, status) =>
        set((s) => {
          const others = s.records.filter(
            (r) => !(r.assignmentId === assignmentId && r.studentId === studentId)
          )
          if (!status) return { records: others }
          const existing = s.records.find(
            (r) => r.assignmentId === assignmentId && r.studentId === studentId
          )
          return {
            records: [
              ...others,
              {
                assignmentId,
                studentId,
                status,
                memo: existing?.memo,
                checkedAt: Date.now(),
              },
            ],
          }
        }),
      setMemo: (assignmentId, studentId, memo) =>
        set((s) => {
          const others = s.records.filter(
            (r) => !(r.assignmentId === assignmentId && r.studentId === studentId)
          )
          const existing = s.records.find(
            (r) => r.assignmentId === assignmentId && r.studentId === studentId
          )
          if (!existing && !memo.trim()) return s
          return {
            records: [
              ...others,
              {
                assignmentId,
                studentId,
                status: existing?.status ?? 'done',
                memo: memo.trim() || undefined,
                checkedAt: Date.now(),
              },
            ],
          }
        }),
      getRecord: (assignmentId, studentId) =>
        get().records.find(
          (r) => r.assignmentId === assignmentId && r.studentId === studentId
        ),
      missCountByStudent: (studentId, days = 14) => {
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
        const recentAssignments = new Set(
          get()
            .assignments.filter((a) => a.createdAt >= cutoff)
            .map((a) => a.id)
        )
        return get().records.filter(
          (r) =>
            r.studentId === studentId &&
            recentAssignments.has(r.assignmentId) &&
            (r.status === 'missing' || r.status === 'partial')
        ).length
      },
    }),
    { name: 'mumuapp-homework-v1' }
  )
)
