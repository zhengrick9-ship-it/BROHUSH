'use client'
import { useEffect, useState } from 'react'

export default function WCW2026Page() {
  const [matches, setMatches] = useState<any[]>([])
  const [bets, setBets] = useState<any[]>([])

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
  })
  const mus = calc(musBets); const tk = calc(tkBets)

  if (!matches.length) return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-gray-300 animate-pulse">加载中...</div>
    </div>
  )

  return (
    <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex items-center gap-2 text-xs text-gray-400 font-mono mb-1">
        <a href="/" className="hover:text-gray-600">BRORUSH</a>
        <span>/</span>
        <span className="text-gray-500">WCW2026</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">🌍 WCW2026 世界杯</h1>
      <p className="text-gray-400 text-sm mb-6">2026 世界杯 · 24 场投注方案跟踪</p>

      {/* 双人概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3"><span>👤</span><span className="font-semibold text-orange-600">木四</span></div>
          <div className="grid grid-cols-4 gap-3 text-sm">
            <div><div className="text-xs text-gray-400">投入</div><div className="font-semibold text-gray-900 font-mono-custom">{mus.stake}元</div></div>
            <div><div className="text-xs text-gray-400">盈亏</div><div className={`font-semibold font-mono-custom ${mus.profit > 0 ? 'text-green-600' : mus.profit < 0 ? 'text-red-500' : ''}`}>{mus.profit > 0 ? '+' : ''}{mus.profit}</div></div>
            <div><div className="text-xs text-gray-400">ROI</div><div className={`font-semibold font-mono-custom ${mus.profit > 0 ? 'text-green-600' : mus.profit < 0 ? 'text-red-500' : ''}`}>{mus.stake > 0 ? ((mus.profit/mus.stake)*100).toFixed(1) : '0'}%</div></div>
            <div><div className="text-xs text-gray-400">战绩</div><div className="font-semibold text-gray-900">{mus.won}W {mus.lost}L</div></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3"><span>👤</span><span className="font-semibold text-blue-600">听课</span></div>
          <div className="grid grid-cols-4 gap-3 text-sm">
            <div><div className="text-xs text-gray-400">投入</div><div className="font-semibold text-gray-900 font-mono-custom">{tk.stake}元</div></div>
            <div><div className="text-xs text-gray-400">盈亏</div><div className={`font-semibold font-mono-custom ${tk.profit > 0 ? 'text-green-600' : tk.profit < 0 ? 'text-red-500' : ''}`}>{tk.profit > 0 ? '+' : ''}{tk.profit}</div></div>
            <div><div className="text-xs text-gray-400">ROI</div><div className={`font-semibold font-mono-custom ${tk.profit > 0 ? 'text-green-600' : tk.profit < 0 ? 'text-red-500' : ''}`}>{tk.stake > 0 ? ((tk.profit/tk.stake)*100).toFixed(1) : '0'}%</div></div>
            <div><div className="text-xs text-gray-400">战绩</div><div className="font-semibold text-gray-900">{tk.won}W {tk.lost}L</div></div>
          </div>
        </div>
      </div>

      {/* 导航 */}
      <div className="flex gap-4 mb-6 border-b border-gray-100">
        <span className="px-1 pb-3 text-sm font-medium text-orange-600 border-b-2 border-orange-500">📅 赛程</span>
        <a href="/projects/wcw2026/bets" className="px-1 pb-3 text-sm text-gray-400 hover:text-gray-600 border-b-2 border-transparent transition-colors">💰 投注记录</a>
        <a href="/projects/wcw2026/pnl" className="px-1 pb-3 text-sm text-gray-400 hover:text-gray-600 border-b-2 border-transparent transition-colors">📊 盈亏</a>
      </div>

      {/* 赛程表 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 text-left text-xs text-gray-400">
            <th className="pb-3 font-medium">日期</th><th className="pb-3 font-medium">组</th>
            <th className="pb-3 font-medium">比赛</th><th className="pb-3 font-medium">预测</th>
            <th className="pb-3 font-medium">赔率</th><th className="pb-3 font-medium">边缘</th>
            <th className="pb-3 font-medium">标签</th><th className="pb-3 font-medium">赛果</th>
          </tr></thead>
          <tbody>
            {matches.map((m, i) => (
              <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-3 text-xs text-gray-400 font-mono">{m.match_date?.slice(5)}</td>
                <td className="py-3 text-xs text-gray-400">{m.group_name}</td>
                <td className="py-3 text-sm">
                  <span className="text-gray-900 font-medium">{m.home_team}</span>
                  <span className="text-gray-300 mx-1">vs</span>
                  <span className="text-gray-900 font-medium">{m.away_team}</span>
                </td>
                <td className="py-3">
                  <span className={`tag ${m.prediction === 'H' ? 'tag-h' : m.prediction === 'A' ? 'tag-a' : 'tag-d'}`}>
                    {m.prediction === 'H' ? '主胜' : m.prediction === 'A' ? '客胜' : '平'}
                  </span>
                  <div className="text-xs text-gray-400 mt-0.5 font-mono">
                    {Math.round((m.model_prob_h||0)*100)}/{Math.round((m.model_prob_d||0)*100)}/{Math.round((m.model_prob_a||0)*100)}
                  </div>
                </td>
                <td className="py-3 text-xs text-gray-500 font-mono">{m.odds_h}/{m.odds_d}/{m.odds_a}</td>
                <td className="py-3 text-xs text-green-600 font-medium font-mono">+{m.edge_pct}%</td>
                <td className="py-3">
                  <span className={`tag ${m.strategy_tag === 'CU' ? 'tag-cu' : m.strategy_tag === 'Value' ? 'tag-value' : 'tag-edge'}`}>{m.strategy_tag}</span>
                </td>
                <td className="py-3">
                  {m.match_status === 'finished'
                    ? <span className={`text-sm font-semibold ${m.actual_result === m.prediction ? 'text-green-600' : 'text-red-500'}`}>{m.home_score}-{m.away_score}</span>
                    : <span className="text-xs text-gray-300">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
