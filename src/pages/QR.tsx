import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

const recentKey = 'mumuapp-qr-recent'
const loadRecent = (): string[] => {
  try {
    const v = localStorage.getItem(recentKey)
    return v ? (JSON.parse(v) as string[]) : []
  } catch {
    return []
  }
}
const saveRecent = (list: string[]) =>
  localStorage.setItem(recentKey, JSON.stringify(list))

export default function QR() {
  const [text, setText] = useState('')
  const [size, setSize] = useState(280)
  const [recent, setRecent] = useState<string[]>(loadRecent)
  const [fullscreen, setFullscreen] = useState(false)

  const remember = () => {
    if (!text.trim()) return
    const next = [text, ...recent.filter((r) => r !== text)].slice(0, 8)
    setRecent(next)
    saveRecent(next)
  }

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      remember()
      setFullscreen(true)
    }
  }

  const value = text.trim()

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight mb-6 bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">
        QR 코드
      </h1>

      <div className="glass rounded-2xl p-5 mb-4">
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleEnter}
          placeholder="URL이나 텍스트를 입력하고 Enter"
          className="w-full px-4 py-3 rounded-xl glass-input mb-3"
        />
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500">크기</span>
          <input
            type="range"
            min={160}
            max={400}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="flex-1 accent-indigo-500"
          />
          <span className="text-slate-400 tabular-nums w-10">{size}px</span>
          <button
            onClick={() => {
              remember()
              setFullscreen(true)
            }}
            disabled={!value}
            className="px-4 py-2 rounded-xl text-sm font-semibold glass-btn-primary disabled:opacity-40"
          >
            전체화면
          </button>
        </div>
      </div>

      {value ? (
        <div className="glass-strong rounded-3xl p-8 flex flex-col items-center mb-6">
          <div className="bg-white p-4 rounded-2xl">
            <QRCodeSVG value={value} size={size} level="M" />
          </div>
          <div className="text-xs text-slate-500 mt-3 max-w-full truncate">
            {value}
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl py-16 text-center text-slate-400 mb-6">
          위에 URL을 입력하면 QR 코드가 표시됩니다.
        </div>
      )}

      {recent.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
            최근
          </div>
          <div className="flex flex-wrap gap-2">
            {recent.map((r) => (
              <button
                key={r}
                onClick={() => setText(r)}
                className="px-3 py-1.5 rounded-full text-xs glass-btn text-slate-600 max-w-xs truncate"
                title={r}
              >
                {r}
              </button>
            ))}
            <button
              onClick={() => {
                setRecent([])
                saveRecent([])
              }}
              className="px-3 py-1.5 rounded-full text-xs text-slate-400 hover:text-red-500"
            >
              ✕ 비우기
            </button>
          </div>
        </div>
      )}

      {fullscreen && value && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/85 backdrop-blur-md p-8"
          onClick={() => setFullscreen(false)}
        >
          <div className="bg-white p-8 rounded-3xl shadow-2xl">
            <QRCodeSVG value={value} size={Math.min(window.innerHeight - 200, 600)} level="M" />
          </div>
          <div className="text-white/80 mt-6 text-sm max-w-2xl text-center break-all">
            {value}
          </div>
          <div className="text-white/40 mt-3 text-xs">화면 아무 곳을 누르면 닫힙니다</div>
        </div>
      )}
    </div>
  )
}
