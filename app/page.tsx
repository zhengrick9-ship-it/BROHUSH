'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const [name, setName] = useState('')
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const v = localStorage.getItem('brorush_name')
    if (v === '木四' || v === '听课') setVerified(true)
    setLoading(false)
  }, [])

  const handleEnter = () => {
    if (name.trim() === '木四' || name.trim() === '听课') {
      localStorage.setItem('brorush_name', name.trim())
      setVerified(true)
    } else {
      setError('验证失败，请重新输入')
      setTimeout(() => setError(''), 2000)
    }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#080808]"><div className="text-[#5e5d59] text-sm">加载中...</div></div>

  if (!verified) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-[#080808]">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#f1f1ef]">BRORUSH</h1>
            <p className="text-[#5e5d59] text-sm mt-1">项目协作记录系统</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#b0aea5]">名称</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEnter()}
                className="w-full mt-1 px-3 py-2 bg-[#141413] border border-[#1f1e1d] rounded-lg text-sm text-[#f1f1ef] placeholder-[#5e5d59] focus:outline-none focus:border-[#146ef5] focus:ring-2 focus:ring-[#146ef5]/10 transition-all"
                placeholder="请输入名称" autoFocus />
            </div>
            {error && <p className="text-sm text-[#f87171]">{error}</p>}
            <button onClick={handleEnter} className="w-full py-2 bg-[#146ef5] text-white text-sm font-medium rounded-lg hover:bg-[#0055d4] transition-colors">进入</button>
          </div>
        </div>
      </div>
    )
  }

  return <Dashboard />
}

function Dashboard() {
  const [bets, setBets] = useState<any[]>([])
  const myName = typeof window !== 'undefined' ? localStorage.getItem('brorush_name') : ''

  useEffect(() => {
    fetch('/api/bets').then(r => r.json()).then(setBets)
  }, [])

  const myBets = bets.filter((b: any) => b.person === myName)
  const totalStake = myBets.reduce((s: number, b: any) => s + b.stake, 0)
  const totalProfit = myBets.reduce((s: number, b: any) => s + (b.profit || 0), 0)
  const won = myBets.filter((b: any) => b.result === 'won').length
  const completed = myBets.filter((b: any) => b.result !== 'pending').length

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
      {/* 顶栏 */}
      <div className="flex items-center justify-between mb-16">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#146ef5]" />
          <span className="text-sm font-medium text-[#f1f1ef]">BRORUSH</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#5e5d59]">{myName}</span>
          <button onClick={() => { localStorage.removeItem('brorush_name'); location.reload() }}
            className="text-sm text-[#5e5d59] hover:text-[#b0aea5] transition-colors">退出</button>
        </div>
      </div>

      {/* Hero 板块 - 杂志式布局 */}
      <div className="mb-16">
        <p className="text-xs text-[#146ef5] font-medium mb-3 tracking-widest uppercase">项目</p>
        <Link href="/projects/wcw2026" className="block group">
          <div className="card p-8 md:p-10 group-hover:border-[#146ef5]/20 transition-all duration-300">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">🌍</span>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#f1f1ef] tracking-tight">WCW2026 世界杯</h2>
                    <p className="text-[#5e5d59] text-sm mt-1">24 场投注方案跟踪 · 盈亏统计 · 赛果更新</p>
                  </div>
                </div>

                {myBets.length > 0 && (
                  <div className="flex flex-wrap gap-x-8 gap-y-2 mt-6 pt-6 border-t border-[#1f1e1d]">
                    <div><div className="text-xs text-[#5e5d59]">总投入</div><div className="text-lg font-semibold text-[#f1f1ef] font-mono-custom">{totalStake}元</div></div>
                    <div><div className="text-xs text-[#5e5d59]">盈亏</div><div className={`text-lg font-semibold font-mono-custom ${totalProfit > 0 ? 'text-[#4ade80]' : totalProfit < 0 ? 'text-[#f87171]' : 'text-[#f1f1ef]'}`}>{totalProfit > 0 ? '+' : ''}{totalProfit}元</div></div>
                    <div><div className="text-xs text-[#5e5d59]">胜率</div><div className="text-lg font-semibold text-[#f1f1ef] font-mono-custom">{completed > 0 ? `${((won/completed)*100).toFixed(1)}%` : '-'}</div></div>
                    {completed > 0 && <div><div className="text-xs text-[#5e5d59]">战绩</div><div className="text-lg font-semibold text-[#f1f1ef] font-mono-custom">{won}W/{completed-won}L</div></div>}
                  </div>
                )}

                <div className="mt-6 flex items-center gap-4 text-sm">
                  <span className="text-[#146ef5] font-medium group-hover:underline">
                    查看详情 →
                  </span>
                  <span className="text-xs text-[#5e5d59]">👤 木四 · 👤 听课 · 各 14 注</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* 底部占位 - 后续可加更多项目 */}
      <div className="text-center">
        <p className="text-xs text-[#3d3d3a]">BRORUSH · 项目协作记录系统</p>
      </div>
    </div>
  )
}
