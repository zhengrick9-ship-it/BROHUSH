'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const supabase = createClient()

export default function WCW2026Page() {
  const [matches, setMatches] = useState<any[]>([])
  const [bets, setBets] = useState<any[]>([])
  const myName = typeof window !== 'undefined' ? localStorage.getItem('brorush_name') || '' : ''

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => { setMatches(d.matches); setBets(d.bets) })
  }, [])

  const myBets = bets.filter(b => b.person === myName)
  const musBets = bets.filter(b => b.person === '木四')
  const tkBets = bets.filter(b => b.person === '听课')

  const calc = (bs: any[]) => ({
    stake: bs.reduce((s, b) => s + b.stake, 0),
    profit: bs.reduce((s, b) => s + (b.profit || 0), 0),
    won: bs.filter(b => b.result === 'won').length,
    lost: bs.filter(b => b.result === 'lost').length,
    completed: bs.filter(b => b.result !== 'pending').length,
  })

  const my = calc(myBets)
  const mus = calc(musBets)
  const tk = calc(tkBets)

  if (!matches.length) return <div className="flex min-h-screen items-center justify-center text-gray-400">加载中...</div>

  return (
    <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
      <div className="text-sm text-gray-400 mb-1"><span className="text-gray-600">BRORUSH / WCW2026</span></div>
      <h1 className="text-2xl font-bold mb-1">🌍 WCW2026 世界杯</h1>
      <p className="text-gray-500 text-sm mb-6">2026 世界杯 · 24 场投注方案跟踪</p>

      {/* 双人盈亏概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-2"><span className="text-lg">👤</span><span className="font-bold text-purple-700">木四</span></div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div>投入<br/><strong className="text-sm">{mus.stake}元</strong></div>
            <div>盈亏<br/><strong className={`text-sm ${mus.profit > 0 ? 'text-green-600' : mus.profit < 0 ? 'text-red-600' : ''}`}>{mus.profit > 0 ? '+' : ''}{mus.profit}元</strong></div>
            <div>ROI<br/><strong className={`text-sm ${mus.profit > 0 ? 'text-green-600' : mus.profit < 0 ? 'text-red-600' : ''}`}>{mus.stake > 0 ? ((mus.profit/mus.stake)*100).toFixed(1) : '0'}%</strong></div>
            <div>战绩<br/><strong className="text-sm">{mus.won}W/{mus.lost}L</strong></div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-2"><span className="text-lg">👤</span><span className="font-bold text-blue-700">听课</span></div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div>投入<br/><strong className="text-sm">{tk.stake}元</strong></div>
            <div>盈亏<br/><strong className={`text-sm ${tk.profit > 0 ? 'text-green-600' : tk.profit < 0 ? 'text-red-600' : ''}`}>{tk.profit > 0 ? '+' : ''}{tk.profit}元</strong></div>
            <div>ROI<br/><strong className={`text-sm ${tk.profit > 0 ? 'text-green-600' : tk.profit < 0 ? 'text-red-600' : ''}`}>{tk.stake > 0 ? ((tk.profit/tk.stake)*100).toFixed(1) : '0'}%</strong></div>
            <div>战绩<br/><strong className="text-sm">{tk.won}W/{tk.lost}L</strong></div>
          </div>
        </div>
      </div>

      {/* 导航 */}
      <div className="flex gap-2 mb-6 border-b">
        <span className="px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">📅 赛程</span>
        <a href="/projects/wcw2026/bets" className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">💰 投注记录</a>
        <a href="/projects/wcw2026/pnl" className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">📊 盈亏</a>
      </div>

      {/* 赛程 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-400 text-xs">
            <th className="pb-2 font-medium">日期</th><th className="pb-2 font-medium">组</th>
            <th className="pb-2 font-medium">比赛</th><th className="pb-2 font-medium">预测</th>
            <th className="pb-2 font-medium">赔率</th><th className="pb-2 font-medium">边缘</th>
            <th className="pb-2 font-medium">标签</th><th className="pb-2 font-medium">赛果</th>
          </tr></thead>
          <tbody>
            {matches.map(m => (
              <tr key={m.id} className="border-b hover:bg-gray-50">
                <td className="py-2.5 text-xs">{m.match_date?.slice(5)}</td>
                <td className="py-2.5 text-xs">{m.group_name}</td>
                <td className="py-2.5 text-sm font-medium">{m.home_team}<br/><span className="text-gray-400">vs</span> {m.away_team}</td>
                <td className="py-2.5">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${m.prediction === 'H' ? 'bg-blue-100 text-blue-700' : m.prediction === 'A' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                    {m.prediction === 'H' ? '主胜' : m.prediction === 'A' ? '客胜' : '平'}
                  </span>
                  <div className="text-xs text-gray-400 mt-0.5">H{Math.round((m.model_prob_h||0)*100)}% D{Math.round((m.model_prob_d||0)*100)}% A{Math.round((m.model_prob_a||0)*100)}%</div>
                </td>
                <td className="py-2.5 text-xs">{m.odds_h}/{m.odds_d}/{m.odds_a}</td>
                <td className="py-2.5 text-xs text-green-600 font-medium">+{m.edge_pct}%</td>
                <td className="py-2.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${m.strategy_tag === 'CU' ? 'bg-orange-100 text-orange-700' : m.strategy_tag === 'Value' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{m.strategy_tag}</span>
                </td>
                <td className="py-2.5">
                  {m.match_status === 'finished'
                    ? <span className={`text-xs font-bold ${m.actual_result === m.prediction ? 'text-green-600' : 'text-red-600'}`}>{m.actual_result === 'H' ? '主胜' : m.actual_result === 'A' ? '客胜' : '平'} {m.home_score}-{m.away_score}</span>
                    : <span className="text-xs text-gray-300">-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
