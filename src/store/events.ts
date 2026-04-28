import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DDayEvent = {
  id: string
  title: string
  date: string // YYYY-MM-DD
  emoji?: string
  pinned?: boolean
}

type State = {
  events: DDayEvent[]
  addEvent: (e: Omit<DDayEvent, 'id'>) => void
  updateEvent: (id: string, patch: Partial<DDayEvent>) => void
  removeEvent: (id: string) => void
}

const uid = () => Math.random().toString(36).slice(2, 10)

export const daysUntil = (ymd: string): number => {
  const [y, m, d] = ymd.split('-').map(Number)
  const target = new Date(y, m - 1, d).getTime()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target - today.getTime()) / (1000 * 60 * 60 * 24))
}

export const fmtDDay = (n: number): string => {
  if (n === 0) return 'D-Day'
  if (n > 0) return `D-${n}`
  return `D+${-n}`
}

export const useEvents = create<State>()(
  persist(
    (set) => ({
      events: [],
      addEvent: (e) =>
        set((s) => ({ events: [{ ...e, id: uid() }, ...s.events] })),
      updateEvent: (id, patch) =>
        set((s) => ({
          events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),
      removeEvent: (id) =>
        set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
    }),
    { name: 'mumuapp-events-v1' }
  )
)
