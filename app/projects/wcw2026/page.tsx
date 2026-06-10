'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function WCW2026Page() {
  const supabase = createClient()
  const [matches, setMatches] = useState<any[]>([])
  const [bets, setBets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('matches').select('*').order('match_date').order('id'),
      supabase.from('bets').select('*')
    ]).then(([m, b]) => {
      setMatches(m.data || [])
      setBets(b.data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-400">加载中...</div>

  const totalStake = bets.reduce((s, b) => s + b.stake, 0)
  const totalProfit = bets.reduce((s, b) => s + (b.profit || 0), 0)
  const won = bets.filter(b => b.result === 'won').length
  const lost = bets.filter(b => b.result === 'lost').length
  const completed = won + lost
  const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0
  const winRate = completed > 0 ? (won / completed) * 100 : 0

  return (
    <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
      <div className="text-sm text-gray-400 mb-1"><span className="text-gray-600">BRORUSH / WCW2026</span></div>
      <h1 className="text-2xl font-bold mb-1">🌍 WCW2026 世界杯</h1>
      <p className="text-gray-500 text-sm mb-6">2026 世界杯 · 24 场投注方案跟踪</p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-xs text-gray-400">总投入</div>
          <div className="text-xl font-bold mt-1">{totalStake.toLocaleString()}元</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-xs text-gray-400">盈亏</div>
          <div className={	ext-xl font-bold mt-1 }>
            {totalProfit > 0 ? '+' : ''}{totalProfit.toLocaleString()}元
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-xs text-gray-400">ROI</div>
          <div className={	ext-xl font-bold mt-1 }>{roi.toFixed(1)}%</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-xs text-gray-400">胜率</div>
          <div className="text-xl font-bold mt-1">{completed > 0 ? ${winRate.toFixed(1)}% : '-'}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-xs text-gray-400">战绩</div>
          <div className="text-xl font-bold mt-1">{won}W / {lost}L</div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b">
        <span className="px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">📅 赛程</span>
        <a href="/projects/wcw2026/bets" className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">💰 投注记录</a>
        <a href="/projects/wcw2026/pnl" className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">📊 盈亏</a>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">📭 暂无比赛数据</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-400 text-xs">
                <th className="pb-2 font-medium">日期</th><th className="pb-2 font-medium">组</th>
                <th className="pb-2 font-medium">比赛</th><th className="pb-2 font-medium">预测</th>
                <th className="pb-2 font-medium">赔率</th><th className="pb-2 font-medium">边缘</th>
                <th className="pb-2 font-medium">标签</th><th className="pb-2 font-medium">赛果</th>
              </tr>
            </thead>
            <tbody>
              {matches.map(m => (
                <tr key={m.id} className="border-b hover:bg-gray-50">
                  <td className="py-2.5 text-xs">{m.match_date?.slice(5)}</td>
                  <td className="py-2.5 text-xs">{m.group_name}</td>
                  <td className="py-2.5 text-sm font-medium">{m.home_team}<br/><span className="text-gray-400">vs</span> {m.away_team}</td>
                  <td className="py-2.5">
                    <span className={	ext-xs font-bold px-1.5 py-0.5 rounded }>
                      {m.prediction === 'H' ? '主胜' : m.prediction === 'A' ? '客胜' : '平'}
                    </span>
                    <div className="text-xs text-gray-400 mt-0.5">
                      H{Math.round((m.model_prob_h||0)*100)}% D{Math.round((m.model_prob_d||0)*100)}% A{Math.round((m.model_prob_a||0)*100)}%
                    </div>
                  </td>
                  <td className="py-2.5 text-xs">{m.odds_h}/{m.odds_d}/{m.odds_a}</td>
                  <td className="py-2.5 text-xs text-green-600 font-medium">+{m.edge_pct}%</td>
                  <td className="py-2.5">
                    <span className={	ext-xs px-1.5 py-0.5 rounded }>{m.strategy_tag}</span>
                  </td>
                  <td className="py-2.5">
                    {m.match_status === 'finished'
                      ? <span className={	ext-xs font-bold }>{m.actual_result === 'H' ? '主胜' : m.actual_result === 'A' ? '客胜' : '平'} {m.home_score}-{m.away_score}</span>
                      : <span className="text-xs text-gray-300">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
