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
      setError('❌ 不对哦，再想想~')
      setTimeout(() => setError(''), 2000)
    }
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center" style={{background:'#0a0a0f'}}>
      <div className="text-white/30 text-sm animate-pulse">加载中...</div>
    </div>
  )

  if (!verified) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{background:'radial-gradient(ellipse at top, #1a1a2e, #0a0a0f 60%)'}}>
        <div className="text-center max-w-md animate-fade-in">
          <div className="text-6xl mb-6 animate-bounce">👋</div>
          <h1 className="text-6xl font-black text-white mb-3 tracking-tight" style={{textShadow:'0 0 60px rgba(139,92,246,0.3)'}}>
            你谁啊？
          </h1>
          <p className="text-white/40 text-lg mb-10">输入暗号才能进</p>
          <div className="flex gap-3 justify-center">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEnter()}
              className="text-xl px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/20 w-52 text-center font-bold focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all"
              placeholder="输入暗号"
              autoFocus
            />
            <button onClick={handleEnter}
              className="text-xl px-8 py-4 rounded-2xl bg-purple-600 text-white font-bold hover:bg-purple-500 active:scale-95 transition-all shadow-lg shadow-purple-500/20">
              进入 →
            </button>
          </div>
          {error && <div className="mt-6 text-lg font-bold text-red-400">{error}</div>}
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
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse-glow" />
            <span className="text-xs text-white/30 font-mono">BRORUSH</span>
          </div>
          <h1 className="text-3xl font-bold text-white">项目协作</h1>
        </div>
        <div className="text-right">
          <div className="glass rounded-full px-4 py-1.5 text-sm text-purple-300">{myName}</div>
          <button onClick={() => { localStorage.removeItem('brorush_name'); location.reload() }}
            className="text-xs text-white/20 hover:text-white/40 mt-2 block">切换身份</button>
        </div>
      </header>

      <div className="mb-4"><span className="text-xs text-white/30 font-mono uppercase tracking-wider">项目</span></div>

      <a href="/projects/wcw2026" className="block animate-fade-in" style={{animationDelay:'0.1s'}}>
        <div className="glass rounded-2xl p-6 glass-hover transition-all duration-300 card-gradient">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-2xl mr-2">🌍</span>
              <span className="text-lg font-semibold text-white">WCW2026 世界杯</span>
            </div>
            <span className="text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20 px-3 py-1 rounded-full">
              ● 进行中
            </span>
          </div>
          <p className="text-sm text-white/40 mb-4">24 场投注方案跟踪 · 盈亏统计 · 赛果更新</p>
          {myBets.length > 0 && (
            <div className="flex gap-6 text-sm border-t border-white/5 pt-4">
              <div><span className="text-white/30 text-xs">总投入</span><div className="text-white font-semibold font-mono-custom">{totalStake}元</div></div>
              <div><span className="text-white/30 text-xs">盈亏</span><div className={`font-semibold font-mono-custom ${totalProfit > 0 ? 'text-green-400' : totalProfit < 0 ? 'text-red-400' : 'text-white'}`}>{totalProfit > 0 ? '+' : ''}{totalProfit}元</div></div>
              <div><span className="text-white/30 text-xs">ROI</span><div className={`font-semibold font-mono-custom ${Number(roi) > 0 ? 'text-green-400' : Number(roi) < 0 ? 'text-red-400' : 'text-white'}`}>{roi}%</div></div>
              {completed > 0 && <div><span className="text-white/30 text-xs">战绩</span><div className="text-white font-semibold font-mono-custom">{won}W/{completed-won}L</div></div>}
            </div>
          )}
        </div>
      </a>

      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-4 glass rounded-full px-5 py-2 text-xs text-white/30">
          <span>👤 木四 14注</span>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <span>👤 听课 14注</span>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <span>各 1400 元</span>
        </div>
      </div>
    </div>
  )
}
