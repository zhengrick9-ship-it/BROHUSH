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

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-gray-300 text-sm">加载中...</div>
    </div>
  )

  if (!verified) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-white">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">BRORUSH</h1>
            <p className="text-gray-400 text-sm mt-1">项目协作记录系统</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">名称</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEnter()}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                placeholder="请输入名称"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button onClick={handleEnter}
              className="w-full py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
              进入
            </button>
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

  const myBets = bets.filter(b => b.person === myName)
  const totalStake = myBets.reduce((s: number, b: any) => s + b.stake, 0)
  const totalProfit = myBets.reduce((s: number, b: any) => s + (b.profit || 0), 0)
  const won = myBets.filter((b: any) => b.result === 'won').length
  const completed = myBets.filter((b: any) => b.result !== 'pending').length
  const roi = totalStake > 0 ? ((totalProfit / totalStake) * 100).toFixed(1) : '0'

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
      <header className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">BRORUSH</h1>
          <p className="text-gray-400 text-sm mt-0.5">项目协作记录系统</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-md">{myName}</span>
          <button onClick={() => { localStorage.removeItem('brorush_name'); location.reload() }}
            className="text-xs text-gray-400 hover:text-gray-600">退出</button>
        </div>
      </header>

      <div className="mb-4">
        <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">项目</span>
      </div>

      <Link href="/projects/wcw2026" className="block">
        <div className="card p-5 hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">🌍</span>
              <div>
                <span className="font-semibold text-gray-900">WCW2026 世界杯</span>
                <p className="text-xs text-gray-400 mt-0.5">24 场投注方案跟踪 · 盈亏统计 · 赛果更新</p>
              </div>
            </div>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">进行中</span>
          </div>
          {myBets.length > 0 && (
            <div className="flex gap-6 text-sm border-t border-gray-100 pt-3 mt-1">
              <div><span className="text-xs text-gray-400">总投入</span><div className="font-semibold text-gray-900 font-mono-custom">{totalStake}元</div></div>
              <div><span className="text-xs text-gray-400">盈亏</span><div className={`font-semibold font-mono-custom ${totalProfit > 0 ? 'text-green-600' : totalProfit < 0 ? 'text-red-500' : ''}`}>{totalProfit > 0 ? '+' : ''}{totalProfit}元</div></div>
              <div><span className="text-xs text-gray-400">ROI</span><div className={`font-semibold font-mono-custom ${Number(roi) > 0 ? 'text-green-600' : Number(roi) < 0 ? 'text-red-500' : ''}`}>{roi}%</div></div>
              {completed > 0 && <div><span className="text-xs text-gray-400">战绩</span><div className="font-semibold text-gray-900 font-mono-custom">{won}W/{completed-won}L</div></div>}
            </div>
          )}
        </div>
      </Link>

      <div className="mt-8 text-center">
        <span className="text-xs text-gray-300">👤 木四 · 👤 听课 · 各 14 注 1400 元</span>
      </div>
    </div>
  )
}
