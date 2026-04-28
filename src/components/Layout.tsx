import { NavLink, Outlet } from 'react-router-dom'
import { useStore } from '../store/students'
import { useEffect, useState } from 'react'
import { findCurrentPeriod, useSettings } from '../store/settings'

const tabs = [
  { to: '/', label: '오늘', icon: '🌤️' },
  { to: '/timetable', label: '시간표', icon: '🗓️' },
  { to: '/roster', label: '학생 명단', icon: '👥' },
  { to: '/homework', label: '숙제', icon: '📝' },
  { to: '/memos', label: '관찰 메모', icon: '🗒️' },
  { to: '/checklist', label: '체크판', icon: '✅' },
  { to: '/dday', label: 'D-day', icon: '⏳' },
  { to: '/picker', label: '뽑기', icon: '🎯' },
  { to: '/timer', label: '타이머', icon: '⏱️' },
  { to: '/groups', label: '모둠 편성', icon: '🧩' },
  { to: '/qr', label: 'QR 코드', icon: '📱' },
]

export default function Layout() {
  const className = useStore((s) => s.className)
  const setClassName = useStore((s) => s.setClassName)
  const periods = useSettings((s) => s.periods)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  const cur = findCurrentPeriod(periods, new Date())
  // tick used to force re-render every 30s
  void tick

  return (
    <div className="flex h-full p-4 gap-4">
      <aside className="w-60 shrink-0 glass rounded-3xl p-4 flex flex-col gap-1">
        <div className="px-2 py-3 mb-2">
          <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">
            Class
          </div>
          <input
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="w-full text-lg font-bold bg-transparent outline-none focus:bg-white/50 rounded-lg px-1 -mx-1 transition"
          />
          {cur && cur.state === 'during' && (
            <div className="mt-2 px-2 py-1.5 rounded-lg bg-gradient-to-br from-indigo-100/70 to-violet-100/70 border border-violet-200/60">
              <div className="text-[10px] text-indigo-500 font-semibold">
                NOW
              </div>
              <div className="text-sm font-bold text-indigo-700">
                {cur.period}교시 진행 중
              </div>
              <div className="text-[10px] text-slate-500">
                {cur.start} – {cur.end}
              </div>
            </div>
          )}
          {cur && cur.state === 'break' && (
            <div className="mt-2 px-2 py-1.5 rounded-lg bg-white/40 border border-white/60">
              <div className="text-[10px] text-slate-500 font-semibold">
                NEXT
              </div>
              <div className="text-sm font-bold text-slate-700">
                {cur.period}교시 시작 전
              </div>
              <div className="text-[10px] text-slate-500">{cur.start}</div>
            </div>
          )}
        </div>
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                isActive
                  ? 'bg-white/70 text-indigo-700 font-semibold shadow-sm border border-white/80'
                  : 'text-slate-600 hover:bg-white/40'
              }`
            }
          >
            <span className="text-base">{t.icon}</span>
            <span>{t.label}</span>
          </NavLink>
        ))}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `mt-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition border-t border-white/40 pt-3 ${
              isActive
                ? 'text-indigo-700 font-semibold'
                : 'text-slate-500 hover:bg-white/40'
            }`
          }
        >
          <span className="text-base">⚙️</span>
          <span>설정</span>
        </NavLink>
        <a
          href="https://mumuclass.kr"
          target="_blank"
          rel="noreferrer noopener"
          className="mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition bg-gradient-to-br from-indigo-100/70 to-violet-100/70 hover:from-indigo-200/70 hover:to-violet-200/70 border border-white/70 group"
        >
          <span className="text-base">🌳</span>
          <span className="flex-1 font-semibold text-indigo-700">
            무궁무진클래스
          </span>
          <span className="text-xs text-indigo-400 group-hover:translate-x-0.5 transition-transform">
            ↗
          </span>
        </a>
        <div className="mt-2 text-[10px] text-slate-400 px-3 tracking-wide">
          학기 동반자 · MVP
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
