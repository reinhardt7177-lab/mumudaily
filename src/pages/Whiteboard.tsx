import { useEffect, useRef, useState } from 'react'

type Point = { x: number; y: number }
type Stroke = {
  mode: 'pen' | 'eraser'
  color: string
  width: number
  points: Point[]
}

const COLORS = [
  { v: '#0f172a', name: '검정' },
  { v: '#dc2626', name: '빨강' },
  { v: '#2563eb', name: '파랑' },
  { v: '#16a34a', name: '초록' },
  { v: '#ea580c', name: '주황' },
  { v: '#9333ea', name: '보라' },
  { v: '#ca8a04', name: '노랑' },
]

const WIDTHS = [2, 4, 8, 16]
const ERASER_WIDTHS = [16, 32, 64]

export default function Whiteboard() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const strokesRef = useRef<Stroke[]>([])
  const currentRef = useRef<Stroke | null>(null)
  const [, forceRender] = useState(0)
  const [mode, setMode] = useState<'pen' | 'eraser'>('pen')
  const [color, setColor] = useState(COLORS[0].v)
  const [width, setWidth] = useState(4)
  const [eraserWidth, setEraserWidth] = useState(32)
  const [fullscreen, setFullscreen] = useState(false)

  // 캔버스 크기 동기화
  useEffect(() => {
    const c = canvasRef.current
    const el = containerRef.current
    if (!c || !el) return

    const resize = () => {
      const rect = el.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      c.width = rect.width * dpr
      c.height = rect.height * dpr
      c.style.width = `${rect.width}px`
      c.style.height = `${rect.height}px`
      const ctx = c.getContext('2d')
      if (!ctx) return
      ctx.scale(dpr, dpr)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctxRef.current = ctx
      redrawAll()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreen])

  const redrawAll = () => {
    const c = canvasRef.current
    const ctx = ctxRef.current
    if (!c || !ctx) return
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.restore()
    for (const s of strokesRef.current) drawStroke(ctx, s)
  }

  const drawStroke = (ctx: CanvasRenderingContext2D, s: Stroke) => {
    if (s.points.length === 0) return
    ctx.save()
    if (s.mode === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = s.color
    }
    ctx.lineWidth = s.width
    ctx.beginPath()
    ctx.moveTo(s.points[0].x, s.points[0].y)
    for (let i = 1; i < s.points.length; i++) {
      const p = s.points[i]
      const prev = s.points[i - 1]
      // smooth via mid-point
      const mid = { x: (prev.x + p.x) / 2, y: (prev.y + p.y) / 2 }
      ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y)
    }
    const last = s.points[s.points.length - 1]
    ctx.lineTo(last.x, last.y)
    ctx.stroke()
    ctx.restore()
  }

  const getPos = (e: React.PointerEvent): Point => {
    const c = canvasRef.current!
    const rect = c.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    const p = getPos(e)
    currentRef.current = {
      mode,
      color,
      width: mode === 'eraser' ? eraserWidth : width,
      points: [p],
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!currentRef.current) return
    const p = getPos(e)
    currentRef.current.points.push(p)
    const ctx = ctxRef.current
    if (!ctx) return
    drawStroke(ctx, currentRef.current)
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (!currentRef.current) return
    try {
      ;(e.target as Element).releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
    if (currentRef.current.points.length > 0) {
      strokesRef.current.push(currentRef.current)
      forceRender((n) => n + 1)
    }
    currentRef.current = null
  }

  const undo = () => {
    if (strokesRef.current.length === 0) return
    strokesRef.current.pop()
    redrawAll()
    forceRender((n) => n + 1)
  }

  const clearAll = () => {
    if (strokesRef.current.length === 0) return
    if (!confirm('판서 내용을 모두 지울까요?')) return
    strokesRef.current = []
    redrawAll()
    forceRender((n) => n + 1)
  }

  const exportPng = () => {
    const c = canvasRef.current
    if (!c) return
    // 흰 배경 + 콘텐츠 합성한 새 캔버스 만들기
    const tmp = document.createElement('canvas')
    tmp.width = c.width
    tmp.height = c.height
    const tctx = tmp.getContext('2d')!
    tctx.fillStyle = '#ffffff'
    tctx.fillRect(0, 0, tmp.width, tmp.height)
    tctx.drawImage(c, 0, 0)
    const url = tmp.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    const d = new Date()
    a.download = `whiteboard-${d.getFullYear()}${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}-${d.getHours().toString().padStart(2, '0')}${d.getMinutes().toString().padStart(2, '0')}.png`
    a.click()
  }

  const strokeCount = strokesRef.current.length

  const toolbar = (
    <div
      className={`flex flex-wrap items-center gap-2 ${
        fullscreen
          ? 'absolute top-4 left-1/2 -translate-x-1/2 glass-strong rounded-2xl px-4 py-2 z-10'
          : 'glass rounded-2xl p-3 mb-4'
      }`}
    >
      <div className="flex gap-1">
        <button
          onClick={() => setMode('pen')}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
            mode === 'pen' ? 'glass-btn-primary' : 'glass-btn text-slate-600'
          }`}
        >
          ✏️ 펜
        </button>
        <button
          onClick={() => setMode('eraser')}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
            mode === 'eraser'
              ? 'glass-btn-primary'
              : 'glass-btn text-slate-600'
          }`}
        >
          🧽 지우개
        </button>
      </div>

      <div className="w-px h-6 bg-slate-200" />

      {mode === 'pen' ? (
        <>
          <div className="flex items-center gap-1">
            {COLORS.map((c) => (
              <button
                key={c.v}
                onClick={() => setColor(c.v)}
                title={c.name}
                className={`w-7 h-7 rounded-full transition ${
                  color === c.v
                    ? 'ring-2 ring-offset-2 ring-indigo-400 scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c.v }}
              />
            ))}
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div className="flex items-center gap-1">
            {WIDTHS.map((w) => (
              <button
                key={w}
                onClick={() => setWidth(w)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${
                  width === w ? 'glass-btn-primary' : 'glass-btn'
                }`}
                title={`${w}px`}
              >
                <span
                  className="rounded-full bg-current"
                  style={{ width: Math.min(w, 12), height: Math.min(w, 12) }}
                />
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="flex items-center gap-1">
          {ERASER_WIDTHS.map((w) => (
            <button
              key={w}
              onClick={() => setEraserWidth(w)}
              className={`px-3 h-9 rounded-lg text-xs font-semibold transition ${
                eraserWidth === w ? 'glass-btn-primary' : 'glass-btn'
              }`}
            >
              {w}px
            </button>
          ))}
        </div>
      )}

      <div className="w-px h-6 bg-slate-200" />

      <button
        onClick={undo}
        disabled={strokeCount === 0}
        className="px-3 py-1.5 rounded-lg text-sm glass-btn disabled:opacity-30"
      >
        ↶ 되돌리기
      </button>
      <button
        onClick={clearAll}
        className="px-3 py-1.5 rounded-lg text-sm glass-btn text-red-500"
      >
        🗑 전체 지우기
      </button>
      <button
        onClick={exportPng}
        className="px-3 py-1.5 rounded-lg text-sm glass-btn"
      >
        ⬇ PNG 저장
      </button>

      <div className="w-px h-6 bg-slate-200" />

      <button
        onClick={() => setFullscreen((v) => !v)}
        className="px-3 py-1.5 rounded-lg text-sm glass-btn"
      >
        {fullscreen ? '✕ 닫기' : '⛶ 전체화면'}
      </button>
    </div>
  )

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        {toolbar}
        <div ref={containerRef} className="absolute inset-0">
          <canvas
            ref={canvasRef}
            className="block touch-none"
            style={{ cursor: mode === 'eraser' ? 'crosshair' : 'crosshair' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-3xl font-bold tracking-tight mb-6 bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">
        판서
      </h1>

      {toolbar}

      <div
        ref={containerRef}
        className="glass-strong rounded-2xl overflow-hidden bg-white"
        style={{ height: 'calc(100vh - 240px)', minHeight: '480px' }}
      >
        <canvas
          ref={canvasRef}
          className="block touch-none"
          style={{ cursor: 'crosshair' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>
    </div>
  )
}
