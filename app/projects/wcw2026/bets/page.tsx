'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function BetsPage() {
  const supabase = createClient()
  const [bets, setBets] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ match_id: '', direction: 'A', odds: '', stake: '100' })

  const load = async () => {
    const [{ data: m }, { data: b }] = await Promise.all([
      supabase.from('matches').select('*').order('match_date').order('id'),
      supabase.from('bets').select('*').order('created_at', { ascending: false })
    ])
    setMatches(m || [])
    setBets(b || [])
  }

  useEffect(() => { load() }, [])

  const matchMap = new Map(matches.map(m => [m.id, m]))
  const totalStake = bets.reduce((s, b) => s + b.stake, 0)
  const totalProfit = bets.reduce((s, b) => s + (b.profit || 0), 0)

  return (
    <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
        <a href="/">BRORUSH</a><span>/</span>
        <a href="/projects/wcw2026" className="hover:text-gray-600">WCW2026</a><span>/</span>
        <span className="text-gray-600">投注</span>
      </div>
      <h1 className="text-xl font-bold mb-4">💰 投注记录</h1>

      <div className="flex gap-4 mb-4 text-sm">
        <div className="bg-white rounded-lg border px-3 py-2">投入: <strong>{totalStake}元</strong></div>
        <div className="bg-white rounded-lg border px-3 py-2">盈亏: <strong className={totalProfit > 0 ? 'text-green-600' : totalProfit < 0 ? 'text-red-600' : ''}>{totalProfit > 0 ? '+' : ''}{totalProfit}元</strong></div>
        <div className="bg-white rounded-lg border px-3 py-2">共 <strong>{bets.length}</strong> 注</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-400 text-xs">
              <th className="pb-2 font-medium">日期</th><th className="pb-2 font-medium">比赛</th>
              <th className="pb-2 font-medium">方向</th><th className="pb-2 font-medium">赔率</th>
              <th className="pb-2 font-medium">金额</th><th className="pb-2 font-medium">结果</th><th className="pb-2 font-medium">盈亏</th>
            </tr>
          </thead>
          <tbody>
            {bets.map(b => {
              const m = matchMap.get(b.match_id)
              return (
                <tr key={b.id} className="border-b hover:bg-gray-50">
                  <td className="py-2.5 text-xs">{m?.match_date?.slice(5)}</td>
                  <td className="py-2.5 text-xs">{m ? ${m.home_team} vs  : '-'}</td>
                  <td className="py-2.5">
                    <span className={	ext-xs font-medium px-1.5 py-0.5 rounded }>
                      {b.direction === 'H' ? '主胜' : b.direction === 'A' ? '客胜' : '平'}
                    </span>
                  </td>
                  <td className="py-2.5">{b.odds}</td>
                  <td className="py-2.5">{b.stake}元</td>
                  <td className="py-2.5">
                    <span className={	ext-xs px-1.5 py-0.5 rounded }>
                      {b.result === 'won' ? '✅ 赢' : b.result === 'lost' ? '❌ 输' : '⏳'}
                    </span>
                  </td>
                  <td className={py-2.5 font-medium }>
                    {b.result === 'pending' ? '-' : ${b.profit > 0 ? '+' : ''}}
                  </td>
                </tr>
              )
            })}
            {bets.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-400">还没有投注记录</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
