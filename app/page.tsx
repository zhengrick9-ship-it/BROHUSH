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
    if (name.trim() === '木四') {
      localStorage.setItem('brorush_name', '木四')
      setVerified(true)
    } else if (name.trim() === '听课') {
      localStorage.setItem('brorush_name', '听课')
      setVerified(true)
    } else {
      setError('❌ 不对哦，再想想~')
      setTimeout(() => setError(''), 2000)
    }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800"><div className="text-white/50 text-xl animate-pulse">✨ 加载中...</div></div>

  if (!verified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6 animate-bounce">👋</div>
          <h1 className="text-5xl font-black text-white mb-3 tracking-tight drop-shadow-lg">
            你谁啊？
          </h1>
          <p className="text-white/60 text-lg mb-8">输入暗号才能进哦~</p>
          <div className="flex gap-3 justify-center">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEnter()}
              className="text-2xl px-6 py-4 rounded-2xl border-2 border-white/30 bg-white/10 text-white placeholder-white/30 backdrop-blur-sm w-56 text-center font-bold focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-400/30 transition-all"
              placeholder="输入暗号"
              autoFocus
            />
            <button onClick={handleEnter}
              className="text-2xl px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold hover:from-pink-400 hover:to-rose-400 active:scale-95 transition-all shadow-xl shadow-pink-500/30">
              进入 →
            </button>
          </div>
          {error && (
            <div className="mt-6 text-2xl font-bold text-pink-300 animate-wiggle">
              {error}
            </div>
          )}
          <div className="mt-12 text-white/20 text-sm">
            💡 提示：两个字，是一种植物和数字的组合~
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

  return (
    <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">BRORUSH</h1>
          <p className="text-gray-500 text-sm mt-1">项目协作记录系统</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">👤 {myName}</div>
          <button onClick={() => { localStorage.removeItem('brorush_name'); location.reload() }}
            className="text-xs text-gray-400 hover:text-gray-600 mt-1 block">切换身份</button>
        </div>
      </header>

      <a href="/projects/wcw2026" className="block">
        <div className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">🌍 WCW2026 世界杯投注分析</h2>
              <p className="text-gray-500 text-sm mt-1">24 场投注方案跟踪 · 盈亏统计 · 赛果更新</p>
            </div>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">进行中</span>
          </div>
          {myBets.length > 0 && (
            <div className="flex gap-4 mt-3 text-xs">
              <span>投入: <strong>{totalStake}元</strong></span>
              <span className={totalProfit > 0 ? 'text-green-600' : totalProfit < 0 ? 'text-red-600' : ''}>
                盈亏: <strong>{totalProfit > 0 ? '+' : ''}{totalProfit}元</strong>
              </span>
              {completed > 0 && <span>战绩: {won}W/{completed - won}L</span>}
            </div>
          )}
        </div>
      </a>

      <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 border rounded-xl p-4">
        <p className="text-xs text-gray-500 text-center">
          👤 木四 | 👤 听课 &nbsp;·&nbsp; 各 14 注 · 各 1400 元
        </p>
      </div>
    </div>
  )
}
