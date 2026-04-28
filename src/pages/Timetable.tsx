import { useEffect, useState } from 'react'
import { useStore } from '../store/students'
import {
  detectSchoolKind,
  getTimetable,
  type TimetableItem,
} from '../api/neis'

const dayLabels = ['월', '화', '수', '목', '금']

const weekStartOf = (d: Date): Date => {
  const wd = d.getDay() // 0=일
  const diff = wd === 0 ? -6 : 1 - wd // monday
  const ms = new Date(d)
  ms.setDate(d.getDate() + diff)
  ms.setHours(0, 0, 0, 0)
  return ms
}

const fmtRange = (start: Date): string => {
  const end = new Date(start)
  end.setDate(end.getDate() + 4)
  return `${start.getMonth() + 1}/${start.getDate()} – ${end.getMonth() + 1}/${end.getDate()}`
}

const ymdToDay = (ymd: string): number => {
  const y = parseInt(ymd.slice(0, 4), 10)
  const m = parseInt(ymd.slice(4, 6), 10)
  const d = parseInt(ymd.slice(6, 8), 10)
  const wd = new Date(y, m - 1, d).getDay()
  return wd === 0 ? 6 : wd - 1 // mon=0..sun=6
}

export default function Timetable() {
  const school = useStore((s) => s.school)
  const setSchool = useStore((s) => s.setSchool)

  const [grade, setGrade] = useState(school?.grade ?? '')
  const [classNm, setClassNm] = useState(school?.classNm ?? '')
  const [weekStart, setWeekStart] = useState(() => weekStartOf(new Date()))
  const [items, setItems] = useState<TimetableItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setGrade(school?.grade ?? '')
    setClassNm(school?.classNm ?? '')
  }, [school?.grade, school?.classNm])

  useEffect(() => {
    if (!school || !grade || !classNm) return
    const kind = detectSchoolKind(school.SCHUL_KND_SC_NM ?? school.SCHUL_NM)
    const load = async () => {
      setLoading(true)
      const list = await getTimetable(
        kind,
        school.ATPT_OFCDC_SC_CODE,
        school.SD_SCHUL_CODE,
        grade,
        classNm,
        weekStart
      )
      setItems(list)
      setLoading(false)
    }
    load()
  }, [school, grade, classNm, weekStart])

  if (!school) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold tracking-tight mb-4 bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">
          시간표
        </h1>
        <div className="glass rounded-2xl py-20 text-center text-slate-400">
          먼저 <b>오늘</b> 페이지에서 학교를 연결해 주세요.
        </div>
      </div>
    )
  }

  const grouped: Record<string, Record<number, TimetableItem[]>> = {}
  for (const it of items) {
    const dayIdx = ymdToDay(it.ALL_TI_YMD)
    if (dayIdx > 4) continue
    grouped[it.PERIO] ??= {}
    grouped[it.PERIO][dayIdx] ??= []
    grouped[it.PERIO][dayIdx].push(it)
  }
  const periods = Object.keys(grouped).sort((a, b) => Number(a) - Number(b))

  const saveClass = () => {
    if (!school) return
    setSchool({ ...school, grade, classNm })
  }

  const shiftWeek = (delta: number) => {
    const next = new Date(weekStart)
    next.setDate(next.getDate() + delta * 7)
    setWeekStart(next)
  }

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-3xl font-bold tracking-tight mb-6 bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">
        시간표
      </h1>

      <div className="glass rounded-2xl p-5 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <div className="text-xs text-slate-500 mb-1">학년</div>
            <input
              type="text"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              onBlur={saveClass}
              placeholder="3"
              className="w-20 px-3 py-2 rounded-xl glass-input"
            />
          </label>
          <label className="text-sm">
            <div className="text-xs text-slate-500 mb-1">반</div>
            <input
              type="text"
              value={classNm}
              onChange={(e) => setClassNm(e.target.value)}
              onBlur={saveClass}
              placeholder="2"
              className="w-20 px-3 py-2 rounded-xl glass-input"
            />
          </label>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => shiftWeek(-1)}
              className="px-3 py-2 rounded-xl glass-btn text-sm"
            >
              ◀ 지난주
            </button>
            <div className="text-sm font-semibold text-slate-700 min-w-[110px] text-center">
              {fmtRange(weekStart)}
            </div>
            <button
              onClick={() => shiftWeek(1)}
              className="px-3 py-2 rounded-xl glass-btn text-sm"
            >
              다음주 ▶
            </button>
            <button
              onClick={() => setWeekStart(weekStartOf(new Date()))}
              className="px-3 py-2 rounded-xl glass-btn text-sm"
            >
              오늘
            </button>
          </div>
        </div>
      </div>

      {!grade || !classNm ? (
        <div className="glass rounded-2xl py-16 text-center text-slate-400">
          학년·반을 입력하면 시간표가 표시됩니다.
        </div>
      ) : loading ? (
        <div className="glass rounded-2xl py-16 text-center text-slate-400">
          불러오는 중…
        </div>
      ) : periods.length === 0 ? (
        <div className="glass rounded-2xl py-16 text-center text-slate-400">
          이번 주 시간표 데이터가 없어요.
        </div>
      ) : (
        <div className="glass rounded-2xl p-4 overflow-x-auto">
          <div
            className="grid gap-1 min-w-[640px]"
            style={{
              gridTemplateColumns: '60px repeat(5, 1fr)',
            }}
          >
            <div></div>
            {dayLabels.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-bold text-slate-500 py-2"
              >
                {d}
              </div>
            ))}
            {periods.map((p) => (
              <Row key={p} period={p} grouped={grouped[p]} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Row({
  period,
  grouped,
}: {
  period: string
  grouped: Record<number, TimetableItem[]>
}) {
  return (
    <>
      <div className="flex items-center justify-center text-xs font-bold text-slate-400 py-3">
        {period}교시
      </div>
      {[0, 1, 2, 3, 4].map((d) => {
        const cell = grouped[d]?.[0]
        return (
          <div
            key={d}
            className={`min-h-[44px] rounded-lg flex items-center justify-center text-sm font-medium px-2 py-2 text-center ${
              cell
                ? 'bg-gradient-to-br from-indigo-50/80 to-violet-50/80 backdrop-blur-md border border-violet-200/50 text-indigo-700'
                : 'bg-white/30'
            }`}
          >
            {cell?.ITRT_CNTNT ?? ''}
          </div>
        )
      })}
    </>
  )
}
