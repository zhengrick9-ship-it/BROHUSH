'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function BetsPage() {
  const supabase = createClient()
  const [bets, setBets] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ match_id: '', direction: 'A', odds: '', stake: '100' })

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUser(user)
    const [{ data: m }, { data: b }] = await Promise.all([
      supabase.from('matches').select('*').order('match_date').order('id'),
      supabase.from('bets').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    ])
    setMatches(m || [])
    setBets(b || [])
  }

  useEffect(() => { load() }, [])

  const addBet = async () => {
    if (!form.match_id || !form.odds) return
    await supabase.from('bets').insert({
      match_id: form.match_id, user_id: user.id,
      direction: form.direction, odds: parseFloat(form.odds),
      stake: parseFloat(form.stake), result: 'pending', profit: 0,
    })
    setShowForm(false)
    setForm({ match_id: '', direction: 'A', odds: '', stake: '100' })
    load()
  }

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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">💰 投注记录</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
          {showForm ? '取消' : '+ 录入投注'}
        </button>
      </div>

      <div className="flex gap-4 mb-4 text-sm">
        <div className="bg-white rounded-lg border px-3 py-2">投入: <strong>{totalStake}元</strong></div>
        <div className="bg-white rounded-lg border px-3 py-2">盈亏: <strong className={totalProfit > 0 ? 'text-green-600' : totalProfit < 0 ? 'text-red-600' : ''}>{totalProfit > 0 ? '+' : ''}{totalProfit}元</strong></div>
        <div className="bg-white rounded-lg border px-3 py-2">共 <strong>{bets.length}</strong> 注</div>
      </div>

      {showForm && (
        <div className="bg-white border rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold mb-3">录入新投注</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <select value={form.match_id} onChange={e => setForm({...form, match_id: e.target.value})} className="border rounded-lg px-3 py-2 text-sm">
              <option value="">选择比赛</option>
              {matches.filter(m => m.match_status === 'scheduled').map(m => (
                <option key={m.id} value={m.id}>{m.match_date?.slice(5)} {m.home_team} vs {m.away_team}</option>
              ))}
            </select>
            <select value={form.direction} onChange={e => setForm({...form, direction: e.target.value})} className="border rounded-lg px-3 py-2 text-sm">
              <option value="H">主胜</option><option value="D">平</option><option value="A">客胜</option>
            </select>
            <input type="number" step="0.01" value={form.odds} onChange={e => setForm({...form, odds: e.target.value})} placeholder="赔率" className="border rounded-lg px-3 py-2 text-sm" />
            <input type="number" value={form.stake} onChange={e => setForm({...form, stake: e.target.value})} placeholder="金额" className="border rounded-lg px-3 py-2 text-sm" />
            <button onClick={addBet} className="bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700">保存</button>
          </div>
        </div>
      )}

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
                  <td className="py-2.5 text-xs">{m ? `${m.home_team} vs ${m.away_team}` : '-'}</td>
                  <td className="py-2.5">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${b.direction === 'H' ? 'bg-blue-100 text-blue-700' : b.direction === 'A' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                      {b.direction === 'H' ? '主胜' : b.direction === 'A' ? '客胜' : '平'}
                    </span>
                  </td>
                  <td className="py-2.5">{b.odds}</td>
                  <td className="py-2.5">{b.stake}元</td>
                  <td className="py-2.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${b.result === 'won' ? 'bg-green-100 text-green-700' : b.result === 'lost' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                      {b.result === 'won' ? '✅ 赢' : b.result === 'lost' ? '❌ 输' : '⏳'}
                    </span>
                  </td>
                  <td className={`py-2.5 font-medium ${b.profit > 0 ? 'text-green-600' : b.profit < 0 ? 'text-red-600' : ''}`}>
                    {b.result === 'pending' ? '-' : `${b.profit > 0 ? '+' : ''}${b.profit}`}
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
