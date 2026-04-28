import { useEffect, useState } from 'react'
import { useStore } from '../store/students'
import { daysUntil, fmtDDay, useEvents } from '../store/events'
import {
  cleanDishName,
  getMeal,
  getSchedule,
  type Meal,
  type ScheduleItem,
} from '../api/neis'
import {
  getAirQuality,
  getCoords,
  getWeather,
  pmGrade,
  weatherDescription,
  type AirQualityNow,
  type WeatherNow,
} from '../api/weather'
import SchoolSearchModal from '../components/SchoolSearchModal'

const fmtDate = (d: Date) => {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`
}

const fmtYmd = (ymd: string) => {
  const m = parseInt(ymd.slice(4, 6), 10)
  const d = parseInt(ymd.slice(6, 8), 10)
  return `${m}/${d}`
}

const SEOUL = { lat: 37.5665, lon: 126.978 }

export default function Today() {
  const school = useStore((s) => s.school)
  const setSchool = useStore((s) => s.setSchool)
  const events = useEvents((s) => s.events)
  const [open, setOpen] = useState(false)
  const [meals, setMeals] = useState<Meal[]>([])
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(false)
  const [weather, setWeather] = useState<WeatherNow | null>(null)
  const [air, setAir] = useState<AirQualityNow | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    null
  )

  const today = new Date()

  useEffect(() => {
    if (!school) return
    const load = async () => {
      setLoading(true)
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      const [m, sc] = await Promise.all([
        getMeal(school.ATPT_OFCDC_SC_CODE, school.SD_SCHUL_CODE, today),
        getSchedule(
          school.ATPT_OFCDC_SC_CODE,
          school.SD_SCHUL_CODE,
          monthStart,
          monthEnd
        ),
      ])
      setMeals(m)
      setSchedule(sc)
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school?.SD_SCHUL_CODE])

  useEffect(() => {
    const loadGeo = async () => {
      const c = (await getCoords()) ?? SEOUL
      setCoords(c)
      const [w, a] = await Promise.all([
        getWeather(c.lat, c.lon),
        getAirQuality(c.lat, c.lon),
      ])
      setWeather(w)
      setAir(a)
    }
    loadGeo()
  }, [])

  if (!school) {
    return (
      <div className="p-6 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight mb-6 bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">
          오늘
        </h1>
        <div className="glass rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">🏫</div>
          <div className="text-lg font-semibold mb-2">학교를 연결해 주세요</div>
          <div className="text-sm text-slate-500 mb-6">
            급식·학사일정을 자동으로 가져옵니다.
          </div>
          <button
            onClick={() => setOpen(true)}
            className="px-6 py-3 rounded-xl font-semibold glass-btn-primary"
          >
            학교 검색하기
          </button>
        </div>
        <SchoolSearchModal open={open} onClose={() => setOpen(false)} />
      </div>
    )
  }

  const upcomingSchedule = schedule
    .filter((s) => {
      const today0 = parseInt(
        `${today.getFullYear()}${(today.getMonth() + 1)
          .toString()
          .padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`,
        10
      )
      return parseInt(s.AA_YMD, 10) >= today0
    })
    .slice(0, 8)

  const upcomingDdays = [...events]
    .map((e) => ({ e, n: daysUntil(e.date) }))
    .filter((x) => x.n >= 0)
    .sort((a, b) => a.n - b.n)
    .slice(0, 4)

  const wd = weather ? weatherDescription(weather.weatherCode, weather.isDay) : null
  const air25 = air ? pmGrade(air.pm2_5) : null

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-sm text-slate-500">{fmtDate(today)}</div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">
            오늘
          </h1>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="text-xs px-3 py-2 rounded-xl glass-btn"
          title={school.SCHUL_NM}
        >
          🏫 {school.SCHUL_NM}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 날씨 카드 */}
        <div className="glass rounded-2xl p-6 md:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs uppercase tracking-widest text-slate-400">
              Weather
            </div>
            <div className="text-2xl">{wd?.emoji ?? '🌡️'}</div>
          </div>
          {!coords ? (
            <div className="text-sm text-slate-400 py-4">
              위치 권한을 허용하면 표시돼요.
            </div>
          ) : !weather ? (
            <div className="text-sm text-slate-400 py-4">날씨 로딩 중…</div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <div className="text-5xl font-black tracking-tight bg-gradient-to-br from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                  {Math.round(weather.temperature)}°
                </div>
                <div className="text-sm text-slate-500">
                  {wd?.label}
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                체감 {Math.round(weather.apparent)}° · 습도 {weather.humidity}%
              </div>
              {air && air25 && (
                <div className="mt-3 flex items-center gap-1.5">
                  <span
                    className={`text-[11px] font-bold px-2 py-1 rounded-full ${air25.color}`}
                  >
                    초미세 {air25.label}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    PM2.5 {Math.round(air.pm2_5)} / PM10 {Math.round(air.pm10)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 급식 카드 */}
        <div className="glass rounded-2xl p-6 md:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs uppercase tracking-widest text-slate-400">
              Today's Meal
            </div>
            <div className="text-2xl">🍱</div>
          </div>
          {loading ? (
            <div className="text-sm text-slate-400 py-4">불러오는 중…</div>
          ) : meals.length === 0 ? (
            <div className="text-sm text-slate-400 py-4">
              오늘 급식 정보가 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {meals.map((m, i) => (
                <div key={i}>
                  <div className="text-sm font-bold text-indigo-600 mb-2">
                    {m.MMEAL_SC_NM}
                  </div>
                  <ul className="space-y-1 text-sm">
                    {cleanDishName(m.DDISH_NM).map((dish, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-slate-400" />
                        <span>{dish}</span>
                      </li>
                    ))}
                  </ul>
                  {m.CAL_INFO && (
                    <div className="text-[11px] text-slate-400 mt-2">
                      {m.CAL_INFO}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 학사일정 카드 */}
        <div className="glass rounded-2xl p-6 md:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs uppercase tracking-widest text-slate-400">
              Schedule
            </div>
            <div className="text-2xl">📅</div>
          </div>
          {loading ? (
            <div className="text-sm text-slate-400 py-4">불러오는 중…</div>
          ) : upcomingSchedule.length === 0 ? (
            <div className="text-sm text-slate-400 py-4">
              이번 달 학사 일정이 없습니다.
            </div>
          ) : (
            <ul className="space-y-2">
              {upcomingSchedule.map((s, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 py-1.5 border-b border-white/40 last:border-0"
                >
                  <span className="w-12 shrink-0 text-xs font-bold text-indigo-600 bg-white/60 rounded-md px-2 py-1 text-center">
                    {fmtYmd(s.AA_YMD)}
                  </span>
                  <span className="text-sm font-medium flex-1">
                    {s.EVENT_NM}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* D-day 카드 */}
      {upcomingDdays.length > 0 && (
        <div className="glass rounded-2xl p-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs uppercase tracking-widest text-slate-400">
              D-day
            </div>
            <div className="text-2xl">⏳</div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {upcomingDdays.map(({ e, n }) => (
              <div
                key={e.id}
                className="px-3 py-2.5 rounded-xl bg-white/40 backdrop-blur-md border border-white/60"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{e.emoji ?? '📌'}</span>
                  <span className="text-xs font-medium truncate flex-1">
                    {e.title}
                  </span>
                </div>
                <div
                  className={`text-2xl font-black tabular-nums ${
                    n <= 7
                      ? 'bg-gradient-to-br from-rose-500 to-orange-500 bg-clip-text text-transparent'
                      : 'bg-gradient-to-br from-indigo-600 to-violet-700 bg-clip-text text-transparent'
                  }`}
                >
                  {fmtDDay(n)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={() => {
            if (confirm('학교 연결을 해제할까요?')) setSchool(null)
          }}
          className="text-xs text-slate-400 hover:text-red-500"
        >
          학교 연결 해제
        </button>
      </div>

      <SchoolSearchModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
