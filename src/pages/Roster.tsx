import { useState } from 'react'
import { useStore } from '../store/students'

export default function Roster() {
  const students = useStore((s) => s.students)
  const addStudent = useStore((s) => s.addStudent)
  const removeStudent = useStore((s) => s.removeStudent)
  const bulkSetFromText = useStore((s) => s.bulkSetFromText)

  const [input, setInput] = useState('')
  const [showBulk, setShowBulk] = useState(false)
  const [bulkText, setBulkText] = useState('')

  const handleAdd = () => {
    if (!input.trim()) return
    addStudent(input)
    setInput('')
  }

  const handleBulk = () => {
    if (!bulkText.trim()) return
    if (
      students.length > 0 &&
      !confirm('기존 명단을 모두 덮어씁니다. 계속할까요?')
    )
      return
    bulkSetFromText(bulkText)
    setBulkText('')
    setShowBulk(false)
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">
          학생 명단
        </h1>
        <button
          onClick={() => setShowBulk((v) => !v)}
          className="text-sm px-4 py-2 rounded-xl glass-btn"
        >
          {showBulk ? '취소' : '한번에 입력'}
        </button>
      </div>

      {showBulk && (
        <div className="mb-6 glass rounded-2xl p-5">
          <div className="text-sm text-slate-500 mb-2">
            한 줄에 한 명씩 또는 쉼표로 구분해서 붙여넣으세요.
          </div>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={8}
            placeholder={'김민준\n이서연\n박지호\n...'}
            className="w-full p-3 rounded-xl text-sm font-mono glass-input"
          />
          <button
            onClick={handleBulk}
            className="mt-3 px-5 py-2.5 rounded-xl text-sm font-semibold glass-btn-primary"
          >
            명단 저장
          </button>
        </div>
      )}

      {!showBulk && (
        <div className="flex gap-2 mb-6">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="이름을 입력하고 Enter"
            className="flex-1 px-4 py-3 rounded-xl glass-input"
          />
          <button
            onClick={handleAdd}
            className="px-6 py-3 rounded-xl font-semibold glass-btn-primary"
          >
            추가
          </button>
        </div>
      )}

      {students.length === 0 ? (
        <div className="glass rounded-2xl py-20 text-center text-slate-400">
          학생이 아직 없어요. 위에서 추가해 주세요.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {students.map((s) => (
            <div
              key={s.id}
              className="group flex items-center gap-2 px-3 py-2.5 rounded-xl glass-soft hover:glass transition"
            >
              <span className="w-7 h-7 flex items-center justify-center text-[11px] font-bold text-indigo-600 bg-white/60 rounded-lg">
                {s.number}
              </span>
              <span className="flex-1 text-sm font-medium">{s.name}</span>
              <button
                onClick={() => removeStudent(s.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 text-xs transition"
                title="삭제"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {students.length > 0 && (
        <div className="mt-6 text-sm text-slate-400">
          총 <span className="font-semibold text-slate-600">{students.length}</span>명
        </div>
      )}
    </div>
  )
}
