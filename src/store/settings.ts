import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PeriodTime = {
  period: number
  start: string // HH:MM
  end: string
}

// 초등학교 표준 시간표
export const DEFAULT_PERIODS: PeriodTime[] = [
  { period: 1, start: '09:00', end: '09:40' },
  { period: 2, start: '09:50', end: '10:30' },
  { period: 3, start: '10:40', end: '11:20' },
  { period: 4, start: '11:30', end: '12:10' },
  { period: 5, start: '13:00', end: '13:40' },
  { period: 6, start: '13:50', end: '14:30' },
]

type State = {
  chimeEnabled: boolean
  chimeStart: boolean // 시업
  chimeEnd: boolean // 종업
  chimePrewarn: boolean // 시작 1분 전 예비종
  periods: PeriodTime[]
  setChimeEnabled: (v: boolean) => void
  setChimeStart: (v: boolean) => void
  setChimeEnd: (v: boolean) => void
  setChimePrewarn: (v: boolean) => void
  setPeriods: (p: PeriodTime[]) => void
  resetPeriods: () => void
}

export const useSettings = create<State>()(
  persist(
    (set) => ({
      chimeEnabled: false,
      chimeStart: true,
      chimeEnd: false,
      chimePrewarn: false,
      periods: DEFAULT_PERIODS,
      setChimeEnabled: (v) => set({ chimeEnabled: v }),
      setChimeStart: (v) => set({ chimeStart: v }),
      setChimeEnd: (v) => set({ chimeEnd: v }),
      setChimePrewarn: (v) => set({ chimePrewarn: v }),
      setPeriods: (p) => set({ periods: p }),
      resetPeriods: () => set({ periods: DEFAULT_PERIODS }),
    }),
    { name: 'mumuapp-settings-v1' }
  )
)

export type CurrentPeriod = {
  period: number
  start: string
  end: string
  state: 'before' | 'during' | 'break' | 'after'
}

export const findCurrentPeriod = (
  periods: PeriodTime[],
  now: Date
): CurrentPeriod | null => {
  const m = now.getHours() * 60 + now.getMinutes()
  const toMin = (s: string) => {
    const [h, mm] = s.split(':').map(Number)
    return h * 60 + mm
  }
  for (let i = 0; i < periods.length; i++) {
    const p = periods[i]
    const s = toMin(p.start)
    const e = toMin(p.end)
    if (m < s) {
      return {
        period: p.period,
        start: p.start,
        end: p.end,
        state: i === 0 ? 'before' : 'break',
      }
    }
    if (m >= s && m <= e) {
      return { period: p.period, start: p.start, end: p.end, state: 'during' }
    }
  }
  const last = periods[periods.length - 1]
  if (last)
    return {
      period: last.period,
      start: last.start,
      end: last.end,
      state: 'after',
    }
  return null
}
