'use client'
import { useState, useEffect } from 'react'

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
      setError('不对哦，再想想~')
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
        <div className="text-center max-w-md animate-fade-in">
          <div className="text-5xl mb-6">👋</div>
          <h1 className="text-5xl font-bold text-gray-900 mb-2 tracking-tight">你谁啊？</h1>
          <p className="text-gray-400 text-lg mb-10">输入暗号才能进</p>
          <div className="flex gap-3 justify-center">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEnter()}
              className="text-lg px-5 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-300 w-48 text-center font-medium focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all"
              placeholder="输入暗号"
              autoFocus
            />
            <button onClick={handleEnter}
              className="text-lg px-7 py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 active:scale-95 transition-all shadow-sm">
              进入 →
            </button>
          </div>
          {error && <div className="mt-6 text-orange-500 font-medium">{error}</div>}
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
      <header className="mb-10 flex items-start justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-xs text-gray-400 font-mono tracking-wider uppercase">BRORUSH</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">项目协作</h1>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-1.5 text-sm text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            {myName}
          </div>
          <button onClick={() => { localStorage.removeItem('brorush_name'); location.reload() }}
            className="text-xs text-gray-400 hover:text-gray-600 mt-2 block ml-auto">切换身份</button>
        </div>
      </header>

      <div className="mb-4">
        <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">项目</span>
      </div>

      <a href="/projects/wcw2026" className="block animate-fade-in" style={{animationDelay:'0.1s'}}>
        <div className="card p-6 hover:shadow-lg transition-all duration-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-2xl mr-2 align-middle">🌍</span>
              <span className="text-lg font-semibold text-gray-900">WCW2026 世界杯</span>
            </div>
            <span className="tag tag-value">● 进行中</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">24 场投注方案跟踪 · 盈亏统计 · 赛果更新</p>
          {myBets.length > 0 && (
            <div className="flex gap-6 text-sm border-t border-gray-100 pt-4">
              <div><div className="text-xs text-gray-400">总投入</div><div className="font-semibold text-gray-900 font-mono-custom">{totalStake}元</div></div>
              <div><div className="text-xs text-gray-400">盈亏</div><div className={`font-semibold font-mono-custom ${totalProfit > 0 ? 'text-green-600' : totalProfit < 0 ? 'text-red-500' : 'text-gray-900'}`}>{totalProfit > 0 ? '+' : ''}{totalProfit}元</div></div>
              <div><div className="text-xs text-gray-400">ROI</div><div className={`font-semibold font-mono-custom ${Number(roi) > 0 ? 'text-green-600' : Number(roi) < 0 ? 'text-red-500' : 'text-gray-900'}`}>{roi}%</div></div>
              {completed > 0 && <div><div className="text-xs text-gray-400">战绩</div><div className="font-semibold text-gray-900 font-mono-custom">{won}W/{completed-won}L</div></div>}
            </div>
          )}
        </div>
      </a>

      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-3 text-sm text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-5 py-2">
          <span>👤 木四 14注</span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span>👤 听课 14注</span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span>各 1400 元</span>
        </div>
      </div>
    </div>
  )
}
