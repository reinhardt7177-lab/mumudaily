import { useState } from 'react'
import { useStore } from '../store/students'
import { useSettings } from '../store/settings'
import { useEvents } from '../store/events'
import { useHomework } from '../store/homework'
import { useMemos } from '../store/memos'
import SchoolSearchModal from '../components/SchoolSearchModal'
import { playTestChime } from '../components/ChimeRunner'

const TABS = [
  { id: 'school', label: '학교' },
  { id: 'class', label: '학급' },
  { id: 'chime', label: '수업 시간 알림' },
  { id: 'data', label: '데이터' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function Settings() {
  const [tab, setTab] = useState<TabId>('school')

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight mb-6 bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">
        설정
      </h1>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm transition ${
              tab === t.id ? 'glass-btn-primary' : 'glass-btn text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'school' && <SchoolPanel />}
      {tab === 'class' && <ClassPanel />}
      {tab === 'chime' && <ChimePanel />}
      {tab === 'data' && <DataPanel />}
    </div>
  )
}

function SchoolPanel() {
  const school = useStore((s) => s.school)
  const setSchool = useStore((s) => s.setSchool)
  const [open, setOpen] = useState(false)

  return (
    <div className="glass rounded-2xl p-6">
      <div className="text-xs uppercase tracking-widest text-slate-400 mb-3">
        학교 연결
      </div>
      {school ? (
        <div>
          <div className="text-xl font-bold">{school.SCHUL_NM}</div>
          <div className="text-xs text-slate-500 mt-1">
            {school.SCHUL_KND_SC_NM ?? '학교'} · {school.ORG_RDNMA}
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setOpen(true)}
              className="px-4 py-2 rounded-xl glass-btn text-sm"
            >
              학교 변경
            </button>
            <button
              onClick={() => {
                if (confirm('학교 연결을 해제할까요?')) setSchool(null)
              }}
              className="px-4 py-2 rounded-xl glass-btn text-sm text-red-500"
            >
              연결 해제
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="px-5 py-2.5 rounded-xl font-semibold glass-btn-primary text-sm"
        >
          🏫 학교 검색하기
        </button>
      )}
      <SchoolSearchModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

function ClassPanel() {
  const school = useStore((s) => s.school)
  const setSchool = useStore((s) => s.setSchool)
  const className = useStore((s) => s.className)
  const setClassName = useStore((s) => s.setClassName)

  if (!school) {
    return (
      <div className="glass rounded-2xl p-6 text-center text-slate-400">
        먼저 학교를 연결해 주세요.
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-6 space-y-5">
      <div>
        <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
          학급 이름
        </div>
        <input
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl glass-input"
          placeholder="우리 반"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
            학년
          </div>
          <input
            value={school.grade ?? ''}
            onChange={(e) => setSchool({ ...school, grade: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl glass-input"
            placeholder="3"
          />
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
            반
          </div>
          <input
            value={school.classNm ?? ''}
            onChange={(e) => setSchool({ ...school, classNm: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl glass-input"
            placeholder="2"
          />
        </div>
      </div>
      <div className="text-xs text-slate-500">
        시간표에서 사용됩니다.
      </div>
    </div>
  )
}

function ChimePanel() {
  const enabled = useSettings((s) => s.chimeEnabled)
  const chimeStart = useSettings((s) => s.chimeStart)
  const chimeEnd = useSettings((s) => s.chimeEnd)
  const periods = useSettings((s) => s.periods)
  const setChimeEnabled = useSettings((s) => s.setChimeEnabled)
  const setChimeStart = useSettings((s) => s.setChimeStart)
  const setChimeEnd = useSettings((s) => s.setChimeEnd)
  const setPeriods = useSettings((s) => s.setPeriods)
  const reset = useSettings((s) => s.resetPeriods)

  const update = (idx: number, key: 'start' | 'end', value: string) => {
    const next = periods.map((p, i) =>
      i === idx ? { ...p, [key]: value } : p
    )
    setPeriods(next)
  }

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-6">
        <Toggle
          label="시업·종업 차임 켜기"
          desc="평일에 자동으로 차임이 울립니다."
          on={enabled}
          onChange={setChimeEnabled}
        />
        {enabled && (
          <div className="mt-4 pl-1 space-y-3 border-l-2 border-indigo-200 pl-4">
            <Toggle
              label="시업 차임 (수업 시작)"
              on={chimeStart}
              onChange={setChimeStart}
              compact
            />
            <Toggle
              label="종업 차임 (수업 끝)"
              on={chimeEnd}
              onChange={setChimeEnd}
              compact
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => playTestChime(false)}
                className="px-3 py-1.5 rounded-lg glass-btn text-xs"
              >
                ▶ 시업음 미리듣기
              </button>
              <button
                onClick={() => playTestChime(true)}
                className="px-3 py-1.5 rounded-lg glass-btn text-xs"
              >
                ▶ 종업음 미리듣기
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs uppercase tracking-widest text-slate-400">
            교시 시간표
          </div>
          <button
            onClick={() => {
              if (confirm('초등 표준 시간으로 되돌릴까요?')) reset()
            }}
            className="text-xs text-slate-400 hover:text-indigo-600"
          >
            초기화
          </button>
        </div>
        <div className="space-y-2">
          {periods.map((p, i) => (
            <div key={p.period} className="flex items-center gap-3">
              <span className="w-12 text-sm font-bold text-indigo-600">
                {p.period}교시
              </span>
              <input
                type="time"
                value={p.start}
                onChange={(e) => update(i, 'start', e.target.value)}
                className="px-3 py-1.5 rounded-lg glass-input text-sm"
              />
              <span className="text-slate-400">~</span>
              <input
                type="time"
                value={p.end}
                onChange={(e) => update(i, 'end', e.target.value)}
                className="px-3 py-1.5 rounded-lg glass-input text-sm"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DataPanel() {
  const exportAll = () => {
    const data = {
      students: localStorage.getItem('mumuapp-store-v1'),
      homework: localStorage.getItem('mumuapp-homework-v1'),
      memos: localStorage.getItem('mumuapp-memos-v1'),
      events: localStorage.getItem('mumuapp-events-v1'),
      settings: localStorage.getItem('mumuapp-settings-v1'),
      qr: localStorage.getItem('mumuapp-qr-recent'),
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mumuapp-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importAll = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string)
        if (
          !confirm(
            '기존 데이터를 모두 덮어씁니다. 계속할까요?\n복원 후 새로고침이 필요합니다.'
          )
        )
          return
        for (const [key, lsKey] of [
          ['students', 'mumuapp-store-v1'],
          ['homework', 'mumuapp-homework-v1'],
          ['memos', 'mumuapp-memos-v1'],
          ['events', 'mumuapp-events-v1'],
          ['settings', 'mumuapp-settings-v1'],
          ['qr', 'mumuapp-qr-recent'],
        ] as const) {
          if (data[key]) localStorage.setItem(lsKey, data[key])
        }
        alert('복원 완료. 새로고침합니다.')
        window.location.reload()
      } catch {
        alert('파일 형식이 올바르지 않습니다.')
      }
    }
    reader.readAsText(file)
  }

  const clearAll = () => {
    if (
      !confirm(
        '⚠️ 모든 데이터를 삭제합니다.\n학생 명단, 숙제, D-day, 설정 모두 사라집니다.\n계속할까요?'
      )
    )
      return
    if (!confirm('정말 삭제할까요? 되돌릴 수 없습니다.')) return
    ;[
      'mumuapp-store-v1',
      'mumuapp-homework-v1',
      'mumuapp-memos-v1',
      'mumuapp-events-v1',
      'mumuapp-settings-v1',
      'mumuapp-qr-recent',
    ].forEach((k) => localStorage.removeItem(k))
    window.location.reload()
  }

  const studentsCount = useStore.getState().students.length
  const homeworkCount = useHomework.getState().assignments.length
  const memosCount = useMemos.getState().memos.length
  const eventsCount = useEvents.getState().events.length

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-6">
        <div className="text-xs uppercase tracking-widest text-slate-400 mb-3">
          현재 데이터
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
          <Stat label="학생" n={studentsCount} />
          <Stat label="숙제" n={homeworkCount} />
          <Stat label="메모" n={memosCount} />
          <Stat label="D-day" n={eventsCount} />
        </div>
        <div className="text-xs text-slate-500">
          모든 데이터는 이 브라우저에만 저장됩니다.
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-3">
        <div>
          <div className="font-semibold mb-1">백업 내보내기</div>
          <div className="text-xs text-slate-500 mb-2">
            JSON 파일로 다운로드합니다.
          </div>
          <button
            onClick={exportAll}
            className="px-4 py-2 rounded-xl glass-btn-primary text-sm font-semibold"
          >
            ⬇ 내보내기
          </button>
        </div>
        <div className="border-t border-white/40 pt-3">
          <div className="font-semibold mb-1">백업 복원</div>
          <div className="text-xs text-slate-500 mb-2">
            내보낸 JSON 파일을 선택하세요.
          </div>
          <input
            type="file"
            accept="application/json"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) importAll(f)
              e.target.value = ''
            }}
            className="text-xs"
          />
        </div>
        <div className="border-t border-white/40 pt-3">
          <div className="font-semibold mb-1 text-red-500">전체 삭제</div>
          <div className="text-xs text-slate-500 mb-2">
            새 학기 시작 등 데이터를 비울 때.
          </div>
          <button
            onClick={clearAll}
            className="px-4 py-2 rounded-xl bg-rose-100/70 backdrop-blur-md border border-rose-200 text-red-600 text-sm font-semibold hover:bg-rose-200/70"
          >
            ⚠ 모든 데이터 삭제
          </button>
        </div>
      </div>
    </div>
  )
}

function Toggle({
  label,
  desc,
  on,
  onChange,
  compact,
}: {
  label: string
  desc?: string
  on: boolean
  onChange: (v: boolean) => void
  compact?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className={compact ? 'text-sm' : 'font-semibold'}>{label}</div>
        {desc && <div className="text-xs text-slate-500 mt-0.5">{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!on)}
        className={`shrink-0 w-11 h-6 rounded-full transition relative ${
          on ? 'bg-gradient-to-br from-indigo-500 to-violet-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            on ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  )
}

function Stat({ label, n }: { label: string; n: number }) {
  return (
    <div className="bg-white/40 rounded-xl px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-bold tabular-nums">{n}</div>
    </div>
  )
}
