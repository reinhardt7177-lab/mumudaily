import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Student = {
  id: string
  number: number
  name: string
}

export type ChecklistItem = {
  id: string
  title: string
  createdAt: number
  checked: Record<string, boolean>
}

export type SchoolInfo = {
  ATPT_OFCDC_SC_CODE: string
  SD_SCHUL_CODE: string
  SCHUL_NM: string
  ORG_RDNMA: string
  SCHUL_KND_SC_NM?: string
  grade?: string
  classNm?: string
}

type State = {
  className: string
  students: Student[]
  checklists: ChecklistItem[]
  school: SchoolInfo | null
  setClassName: (name: string) => void
  setStudents: (list: Student[]) => void
  addStudent: (name: string) => void
  removeStudent: (id: string) => void
  bulkSetFromText: (text: string) => void
  addChecklist: (title: string) => void
  removeChecklist: (id: string) => void
  toggleCheck: (checklistId: string, studentId: string) => void
  resetChecklist: (checklistId: string) => void
  setSchool: (s: SchoolInfo | null) => void
}

const uid = () => Math.random().toString(36).slice(2, 10)

export const useStore = create<State>()(
  persist(
    (set) => ({
      className: '우리 반',
      students: [],
      checklists: [],
      school: null,
      setSchool: (s) => set({ school: s }),
      setClassName: (name) => set({ className: name }),
      setStudents: (list) => set({ students: list }),
      addStudent: (name) =>
        set((s) => ({
          students: [
            ...s.students,
            { id: uid(), number: s.students.length + 1, name: name.trim() },
          ],
        })),
      removeStudent: (id) =>
        set((s) => ({
          students: s.students
            .filter((x) => x.id !== id)
            .map((x, i) => ({ ...x, number: i + 1 })),
        })),
      bulkSetFromText: (text) => {
        const names = text
          .split(/[\n,]/)
          .map((n) => n.trim())
          .filter(Boolean)
        set({
          students: names.map((name, i) => ({
            id: uid(),
            number: i + 1,
            name,
          })),
        })
      },
      addChecklist: (title) =>
        set((s) => ({
          checklists: [
            {
              id: uid(),
              title: title.trim() || '새 체크리스트',
              createdAt: Date.now(),
              checked: {},
            },
            ...s.checklists,
          ],
        })),
      removeChecklist: (id) =>
        set((s) => ({ checklists: s.checklists.filter((c) => c.id !== id) })),
      toggleCheck: (checklistId, studentId) =>
        set((s) => ({
          checklists: s.checklists.map((c) =>
            c.id === checklistId
              ? {
                  ...c,
                  checked: {
                    ...c.checked,
                    [studentId]: !c.checked[studentId],
                  },
                }
              : c
          ),
        })),
      resetChecklist: (checklistId) =>
        set((s) => ({
          checklists: s.checklists.map((c) =>
            c.id === checklistId ? { ...c, checked: {} } : c
          ),
        })),
    }),
    { name: 'mumuapp-store-v1' }
  )
)
