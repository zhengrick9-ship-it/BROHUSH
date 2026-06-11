'use client'
import { useEffect, useState } from 'react'

export default function WCW2026Page() {
  const [matches, setMatches] = useState<any[]>([])
  const [bets, setBets] = useState<any[]>([])
  const myName = typeof window !== 'undefined' ? localStorage.getItem('brorush_name') || '' : ''

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => { setMatches(d.matches); setBets(d.bets) })
  }, [])

  const musBets = bets.filter(b => b.person === '木四')
  const tkBets = bets.filter(b => b.person === '听课')
  const calc = (bs: any[]) => ({
    stake: bs.reduce((s, b) => s + b.stake, 0),
    profit: bs.reduce((s, b) => s + (b.profit || 0), 0),
    won: bs.filter(b => b.result === 'won').length,
    lost: bs.filter(b => b.result === 'lost').length,
    completed: bs.filter(b => b.result !== 'pending').length,
  })
  const mus = calc(musBets); const tk = calc(tkBets)

  if (!matches.length) return (
    <div className="flex min-h-screen items-center justify-center" style={{background:'#0a0a0f'}}>
      <div className="text-white/30 animate-pulse">加载中...</div>
    </div>
  )

  return (
    <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs text-white/20 font-mono mb-1">
        <a href="/" className="hover:text-white/40">BRORUSH</a>
        <span>/</span>
        <span className="text-white/40">WCW2026</span>
      </div>
      <h1 className="text-2xl font-bold text-white mb-1">🌍 WCW2026 世界杯</h1>
      <p className="text-white/30 text-sm mb-6">2026 世界杯 · 24 场投注方案跟踪</p>

      {/* 双人概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="glass rounded-2xl p-5 card-gradient">
          <div className="flex items-center gap-2 mb-3"><span>👤</span><span className="text-purple-300 font-semibold">木四</span></div>
          <div className="grid grid-cols-4 gap-3 text-sm">
            <div><div className="text-xs text-white/30">投入</div><div className="text-white font-semibold font-mono-custom">{mus.stake}元</div></div>
            <div><div className="text-xs text-white/30">盈亏</div><div className={`font-semibold font-mono-custom ${mus.profit > 0 ? 'text-green-400' : mus.profit < 0 ? 'text-red-400' : ''}`}>{mus.profit > 0 ? '+' : ''}{mus.profit}</div></div>
            <div><div className="text-xs text-white/30">ROI</div><div className={`font-semibold font-mono-custom ${mus.profit > 0 ? 'text-green-400' : mus.profit < 0 ? 'text-red-400' : ''}`}>{mus.stake > 0 ? ((mus.profit/mus.stake)*100).toFixed(1) : '0'}%</div></div>
            <div><div className="text-xs text-white/30">战绩</div><div className="text-white font-semibold">{mus.won}W {mus.lost}L</div></div>
          </div>
        </div>
        <div className="glass rounded-2xl p-5" style={{background:'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.05))'}}>
          <div className="flex items-center gap-2 mb-3"><span>👤</span><span className="text-blue-300 font-semibold">听课</span></div>
          <div className="grid grid-cols-4 gap-3 text-sm">
            <div><div className="text-xs text-white/30">投入</div><div className="text-white font-semibold font-mono-custom">{tk.stake}元</div></div>
            <div><div className="text-xs text-white/30">盈亏</div><div className={`font-semibold font-mono-custom ${tk.profit > 0 ? 'text-green-400' : tk.profit < 0 ? 'text-red-400' : ''}`}>{tk.profit > 0 ? '+' : ''}{tk.profit}</div></div>
            <div><div className="text-xs text-white/30">ROI</div><div className={`font-semibold font-mono-custom ${tk.profit > 0 ? 'text-green-400' : tk.profit < 0 ? 'text-red-400' : ''}`}>{tk.stake > 0 ? ((tk.profit/tk.stake)*100).toFixed(1) : '0'}%</div></div>
            <div><div className="text-xs text-white/30">战绩</div><div className="text-white font-semibold">{tk.won}W {tk.lost}L</div></div>
          </div>
        </div>
      </div>

      {/* 导航 */}
      <div className="flex gap-1 mb-6 border-b border-white/5">
        <span className="px-4 py-2.5 text-sm text-purple-400 border-b-2 border-purple-500 font-medium">📅 赛程</span>
        <a href="/projects/wcw2026/bets" className="px-4 py-2.5 text-sm text-white/40 hover:text-white/60 transition-colors">💰 投注记录</a>
        <a href="/projects/wcw2026/pnl" className="px-4 py-2.5 text-sm text-white/40 hover:text-white/60 transition-colors">📊 盈亏</a>
      </div>

      {/* 赛程表 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/5 text-left text-white/20 text-xs">
            <th className="pb-3 font-medium">日期</th><th className="pb-3 font-medium">组</th>
            <th className="pb-3 font-medium">比赛</th><th className="pb-3 font-medium">预测</th>
            <th className="pb-3 font-medium">赔率</th><th className="pb-3 font-medium">边缘</th>
            <th className="pb-3 font-medium">标签</th><th className="pb-3 font-medium">赛果</th>
          </tr></thead>
          <tbody>
            {matches.map((m, i) => (
              <tr key={m.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors" style={{animationDelay:`${i*0.03}s`}}>
                <td className="py-3 text-xs text-white/30 font-mono">{m.match_date?.slice(5)}</td>
                <td className="py-3 text-xs text-white/30">{m.group_name}</td>
                <td className="py-3 text-sm">
                  <span className="text-white/80">{m.home_team}</span>
                  <span className="text-white/20 mx-1">vs</span>
                  <span className="text-white/80">{m.away_team}</span>
                </td>
                <td className="py-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${m.prediction === 'H' ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20' : m.prediction === 'A' ? 'bg-orange-500/10 text-orange-300 border border-orange-500/20' : 'bg-white/5 text-white/40 border border-white/10'}`}>
                    {m.prediction === 'H' ? '主胜' : m.prediction === 'A' ? '客胜' : '平'}
                  </span>
                  <div className="text-xs text-white/20 mt-0.5 font-mono">
                    {Math.round((m.model_prob_h||0)*100)}/{Math.round((m.model_prob_d||0)*100)}/{Math.round((m.model_prob_a||0)*100)}
                  </div>
                </td>
                <td className="py-3 text-xs text-white/30 font-mono">{m.odds_h}/{m.odds_d}/{m.odds_a}</td>
                <td className="py-3 text-xs text-green-400/80 font-mono">+{m.edge_pct}%</td>
                <td className="py-3">
                  <span className={`text-xs px-2 py-1 rounded-lg ${m.strategy_tag === 'CU' ? 'bg-orange-500/10 text-orange-300' : m.strategy_tag === 'Value' ? 'bg-purple-500/10 text-purple-300' : 'bg-white/5 text-white/30'}`}>{m.strategy_tag}</span>
                </td>
                <td className="py-3">
                  {m.match_status === 'finished'
                    ? <span className={`text-xs font-semibold ${m.actual_result === m.prediction ? 'text-green-400' : 'text-red-400'}`}>{m.home_score}-{m.away_score}</span>
                    : <span className="text-xs text-white/10">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
