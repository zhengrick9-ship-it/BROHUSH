'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function PnLPage() {
  const supabase = createClient()
  const [bets, setBets] = useState<any[]>([])

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      const [{ data: m }, { data: b }] = await Promise.all([
        supabase.from('matches').select('*'),
        supabase.from('bets').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ])
      const mm = new Map(m?.map(x => [x.id, x]) || [])
      setBets((b || []).map(bet => ({ ...bet, match: mm.get(bet.match_id) })))
    })()
  }, [])

  const totalStake = bets.reduce((s, b) => s + b.stake, 0)
  const totalProfit = bets.reduce((s, b) => s + (b.profit || 0), 0)
  const won = bets.filter(b => b.result === 'won').length
  const lost = bets.filter(b => b.result === 'lost').length
  const pending = bets.filter(b => b.result === 'pending').length
  const completed = won + lost
  const winRate = completed > 0 ? (won / completed) * 100 : 0
  const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0

  const daily: Record<string, any[]> = {}
  bets.forEach(b => {
    const d = b.match?.match_date?.slice(5) || '未知'
    if (!daily[d]) daily[d] = []
    daily[d].push(b)
  })

  return (
    <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
        <a href="/">BRORUSH</a><span>/</span>
        <a href="/projects/wcw2026" className="hover:text-gray-600">WCW2026</a><span>/</span>
        <span className="text-gray-600">盈亏</span>
      </div>
      <h1 className="text-xl font-bold mb-4">📊 盈亏统计</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div className="bg-white rounded-xl border p-4"><div className="text-xs text-gray-400">总投入</div><div className="text-xl font-bold mt-1">{totalStake.toLocaleString()}元</div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-xs text-gray-400">净盈亏</div><div className={`text-xl font-bold mt-1 ${totalProfit > 0 ? 'text-green-600' : totalProfit < 0 ? 'text-red-600' : ''}`}>{totalProfit > 0 ? '+' : ''}{totalProfit.toLocaleString()}元</div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-xs text-gray-400">ROI</div><div className={`text-xl font-bold mt-1 ${roi > 0 ? 'text-green-600' : roi < 0 ? 'text-red-600' : ''}`}>{roi.toFixed(1)}%</div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-xs text-gray-400">胜率</div><div className="text-xl font-bold mt-1">{winRate.toFixed(1)}%<span className="text-sm text-gray-400 font-normal"> ({won}/{completed})</span></div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-xs text-gray-400">战绩</div><div className="text-xl font-bold mt-1">{won}W {lost}L</div></div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center"><div className="text-2xl font-bold text-green-600">{won}</div><div className="text-xs text-green-600">赢</div></div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center"><div className="text-2xl font-bold text-red-600">{lost}</div><div className="text-xs text-red-600">输</div></div>
        <div className="bg-gray-50 border rounded-xl p-4 text-center"><div className="text-2xl font-bold text-gray-400">{pending}</div><div className="text-xs text-gray-400">待定</div></div>
      </div>

      {Object.entries(daily).sort().reverse().map(([date, dayBets]) => {
        const dayProfit = dayBets.reduce((s, b) => s + (b.profit || 0), 0)
        const dayStake = dayBets.reduce((s, b) => s + b.stake, 0)
        return (
          <div key={date} className="bg-white border rounded-xl p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">6/{date}</span>
              <span className={`text-sm font-medium ${dayProfit > 0 ? 'text-green-600' : dayProfit < 0 ? 'text-red-600' : ''}`}>
                投入 {dayStake}元 · 盈亏 {dayProfit > 0 ? '+' : ''}{dayProfit}元
              </span>
            </div>
            <div className="divide-y text-xs">
              {dayBets.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between py-1.5">
                  <span>{b.match?.home_team} vs {b.match?.away_team}</span>
                  <span>
                    {b.stake}元@{b.odds} {b.direction === 'H' ? '主胜' : b.direction === 'A' ? '客胜' : '平'} ·
                    {b.result === 'won' ? <span className="text-green-600"> +{b.profit}</span> : b.result === 'lost' ? <span className="text-red-600"> {b.profit}</span> : <span className="text-gray-300"> 待定</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
