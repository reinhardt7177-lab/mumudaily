import { useEffect, useRef, useState } from 'react'
import { searchSchools, type School } from '../api/neis'
import { REGIONS } from '../api/regions'
import { useStore } from '../store/students'

export default function SchoolSearchModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const setSchool = useStore((s) => s.setSchool)
  const [region, setRegion] = useState('')
  const [q, setQ] = useState('')
  const [results, setResults] = useState<School[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    if (!q.trim()) {
      setResults([])
      return
    }
    const t = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const list = await searchSchools(q, region || undefined)
        setResults(list)
      } catch (e) {
        setError(e instanceof Error ? e.message : '검색 실패')
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [q, region])

  if (!open) return null

  const pick = (s: School) => {
    setSchool({
      ATPT_OFCDC_SC_CODE: s.ATPT_OFCDC_SC_CODE,
      SD_SCHUL_CODE: s.SD_SCHUL_CODE,
      SCHUL_NM: s.SCHUL_NM,
      ORG_RDNMA: s.ORG_RDNMA,
      SCHUL_KND_SC_NM: s.SCHUL_KND_SC_NM,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-strong rounded-3xl w-full max-w-lg mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold tracking-tight">학교 연결</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm"
          >
            ✕
          </button>
        </div>

        <div className="text-xs text-slate-500 mb-1">시도교육청 (선택)</div>
        <div className="flex flex-wrap gap-1 mb-3">
          <button
            onClick={() => setRegion('')}
            className={`px-2.5 py-1 rounded-full text-[11px] transition ${
              region === ''
                ? 'glass-btn-primary'
                : 'glass-btn text-slate-600'
            }`}
          >
            전체
          </button>
          {REGIONS.map((r) => (
            <button
              key={r.code}
              onClick={() => setRegion(r.code)}
              className={`px-2.5 py-1 rounded-full text-[11px] transition ${
                region === r.code
                  ? 'glass-btn-primary'
                  : 'glass-btn text-slate-600'
              }`}
            >
              {r.short}
            </button>
          ))}
        </div>

        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="학교 이름 (예: 강진중앙초)"
          className="w-full px-4 py-3 rounded-xl glass-input mb-3"
        />

        {loading && (
          <div className="text-center text-sm text-slate-400 py-4">
            검색 중…
          </div>
        )}
        {error && (
          <div className="text-center text-sm text-red-500 py-4">{error}</div>
        )}

        <div className="max-h-80 overflow-auto space-y-1">
          {!loading && q.trim() && results.length === 0 && (
            <div className="text-center text-sm text-slate-400 py-6">
              결과가 없어요. 시도교육청 필터를 조정해 보세요.
            </div>
          )}
          {results.map((s) => (
            <button
              key={s.SD_SCHUL_CODE}
              onClick={() => pick(s)}
              className="w-full text-left px-4 py-3 rounded-xl glass-soft hover:bg-white/70 transition"
            >
              <div className="font-semibold">{s.SCHUL_NM}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {s.SCHUL_KND_SC_NM} · {s.LCTN_SC_NM} · {s.ORG_RDNMA}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
