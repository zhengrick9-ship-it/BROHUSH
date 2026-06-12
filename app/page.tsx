'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const v = localStorage.getItem('brorush_name')
    if (v === '木四' || v === '听课') {
      router.replace('/projects/wcw2026')
    } else {
      setChecking(false)
    }
  }, [router])

  const handleEnter = () => {
    const n = name.trim()
    if (n === '木四' || n === '听课') {
      localStorage.setItem('brorush_name', n)
      router.replace('/projects/wcw2026')
    } else {
      setError('验证失败，请重新输入')
      setTimeout(() => setError(''), 2000)
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a08]">
        <div className="text-[#6f6e69] text-sm">载入中…</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 bg-[#0a0a08]">
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-2 h-2 rounded-full bg-[#cc785c]" />
            <span className="text-sm font-medium tracking-tight text-[#f5f4ef]">BRORUSH</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#f5f4ef] leading-tight">欢迎回来</h1>
          <p className="text-[#6f6e69] text-sm mt-2 leading-relaxed">输入你的名称以进入项目空间</p>
        </div>
        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEnter()}
            className="w-full px-4 py-3 bg-[#141412] border border-[#2a2a26] rounded-xl text-sm text-[#f5f4ef] placeholder-[#6f6e69] focus:outline-none focus:border-[#cc785c] focus:ring-4 focus:ring-[#cc785c]/10 transition-all"
            placeholder="名称"
            autoFocus
          />
          {error && <p className="text-sm text-[#e07a5f]">{error}</p>}
          <button
            onClick={handleEnter}
            className="w-full py-3 bg-[#cc785c] text-white text-sm font-medium rounded-xl hover:bg-[#b5654a] transition-colors"
          >
            进入
          </button>
        </div>
        <p className="text-xs text-[#3a3a36] mt-10">BRORUSH · 项目协作记录系统</p>
      </div>
    </div>
  )
}
