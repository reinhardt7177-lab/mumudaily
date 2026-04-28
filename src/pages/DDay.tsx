import { useState } from 'react'
import { daysUntil, fmtDDay, useEvents } from '../store/events'

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

const fmtDate = (ymd: string) => {
  const [, m, d] = ymd.split('-').map(Number)
  return `${m}월 ${d}일`
}

const presetEmojis = ['🎒', '🌴', '📝', '🎂', '🏆', '🎉', '📚', '🎨', '⚽', '🌟']

export default function DDay() {
  const events = useEvents((s) => s.events)
  const addEvent = useEvents((s) => s.addEvent)
  const removeEvent = useEvents((s) => s.removeEvent)
  const updateEvent = useEvents((s) => s.updateEvent)

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(todayStr())
  const [emoji, setEmoji] = useState('🎒')

  const sorted = [...events].sort((a, b) => {
    const da = daysUntil(a.date)
    const db = daysUntil(b.date)
    // pinned first, then upcoming asc, then past desc
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1
    const ap = da < 0
    const bp = db < 0
    if (ap !== bp) return ap ? 1 : -1
    return ap ? db - da : da - db
  })

  const handleAdd = () => {
    if (!title.trim()) return
    addEvent({ title: title.trim(), date, emoji })
    setTitle('')
    setDate(todayStr())
    setShowForm(false)
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">
          D-day
        </h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 rounded-xl font-semibold glass-btn-primary text-sm"
        >
          {showForm ? '취소' : '+ 새 D-day'}
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-2xl p-5 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="이름 (예: 여름방학식)"
              className="sm:col-span-2 px-4 py-2.5 rounded-xl glass-input"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-2.5 rounded-xl glass-input"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {presetEmojis.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`w-9 h-9 rounded-lg text-lg transition ${
                  emoji === e
                    ? 'bg-indigo-100 ring-2 ring-indigo-400'
                    : 'glass-btn'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          <button
            onClick={handleAdd}
            className="px-5 py-2 rounded-xl font-semibold glass-btn-primary text-sm"
          >
            추가
          </button>
        </div>
      )}

      {events.length === 0 ? (
        <div className="glass rounded-2xl py-16 text-center text-slate-400">
          아직 D-day가 없어요. 위에서 추가해 주세요.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map((e) => {
            const n = daysUntil(e.date)
            const isPast = n < 0
            return (
              <div
                key={e.id}
                className={`glass rounded-2xl p-5 group transition ${
                  isPast ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="text-4xl">{e.emoji ?? '📅'}</div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() =>
                        updateEvent(e.id, { pinned: !e.pinned })
                      }
                      title={e.pinned ? '핀 해제' : '핀'}
                      className="text-slate-400 hover:text-indigo-500 text-xs"
                    >
                      {e.pinned ? '📌' : '📍'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('삭제할까요?')) removeEvent(e.id)
                      }}
                      className="text-slate-400 hover:text-red-500 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="mt-3 text-sm font-semibold truncate">
                  {e.title}
                </div>
                <div className="text-xs text-slate-500 mb-2">
                  {fmtDate(e.date)}
                </div>
                <div
                  className={`text-3xl font-black tabular-nums tracking-tight ${
                    isPast
                      ? 'text-slate-400'
                      : n <= 7
                        ? 'bg-gradient-to-br from-rose-500 to-orange-500 bg-clip-text text-transparent'
                        : 'bg-gradient-to-br from-indigo-600 to-violet-700 bg-clip-text text-transparent'
                  }`}
                >
                  {fmtDDay(n)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
