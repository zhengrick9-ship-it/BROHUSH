'use client'
import { useEffect, useState } from 'react'

export default function PnLPage() {
  const [bets, setBets] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      const mm = new Map(d.matches.map((x: any) => [x.id, x]))
      setBets(d.bets.map((b: any) => ({...b, match: mm.get(b.match_id)})))
    })
  }, [])

  const musBets = bets.filter(b => b.person === '木四')
  const tkBets = bets.filter(b => b.person === '听课')

  const calc = (bs: any[]) => ({
    stake: bs.reduce((s, b) => s + b.stake, 0),
    profit: bs.reduce((s, b) => s + (b.profit || 0), 0),
    won: bs.filter(b => b.result === 'won').length,
    lost: bs.filter(b => b.result === 'lost').length,
    pending: bs.filter(b => b.result === 'pending').length,
  })

  const renderPnL = (bs: any[], person: string, color: string, bg: string) => {
    const s = calc(bs)
    const roi = s.stake > 0 ? (s.profit / s.stake) * 100 : 0
    const daily: Record<string, any[]> = {}
    bs.forEach(b => {
      const d = b.match?.match_date?.slice(5) || '未知'
      if (!daily[d]) daily[d] = []
      daily[d].push(b)
    })

    return <div className="mb-6">
      <h2 className="font-semibold mb-3" style={{color}}>👤 {person}</h2>
      <div className="grid grid-cols-5 gap-2 mb-4">
        <div className={`${bg} rounded-lg border p-3`}><div className="text-xs text-gray-400">总投入</div><div className="text-lg font-bold">{s.stake}元</div></div>
        <div className={`${bg} rounded-lg border p-3`}><div className="text-xs text-gray-400">净盈亏</div><div className={`text-lg font-bold ${s.profit > 0 ? 'text-green-600' : s.profit < 0 ? 'text-red-600' : ''}`}>{s.profit > 0 ? '+' : ''}{s.profit}元</div></div>
        <div className={`${bg} rounded-lg border p-3`}><div className="text-xs text-gray-400">ROI</div><div className={`text-lg font-bold ${roi > 0 ? 'text-green-600' : roi < 0 ? 'text-red-600' : ''}`}>{roi.toFixed(1)}%</div></div>
        <div className={`${bg} rounded-lg border p-3`}><div className="text-xs text-gray-400">胜率</div><div className="text-lg font-bold">{s.won + s.lost > 0 ? `${(s.won/(s.won+s.lost)*100).toFixed(1)}%` : '-'}</div></div>
        <div className={`${bg} rounded-lg border p-3`}><div className="text-xs text-gray-400">战绩</div><div className="text-lg font-bold">{s.won}W {s.lost}L</div></div>
      </div>

      {Object.entries(daily).sort().reverse().map(([date, dayBets]) => {
        const dp = dayBets.reduce((s, b) => s + (b.profit || 0), 0)
        const ds = dayBets.reduce((s, b) => s + b.stake, 0)
        return <div key={date} className={`${bg} border rounded-lg p-3 mb-2`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-sm">6/{date}</span>
            <span className={`text-sm font-medium ${dp > 0 ? 'text-green-600' : dp < 0 ? 'text-red-600' : ''}`}>投入 {ds}元 · 盈亏 {dp > 0 ? '+' : ''}{dp}元</span>
          </div>
          <div className="divide-y text-xs">
            {dayBets.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between py-1">
                <span>{b.match?.home_team} vs {b.match?.away_team}</span>
                <span>{b.stake}元@{b.odds} {b.direction === 'H' ? '主胜' : b.direction === 'A' ? '客胜' : '平'} · {b.result === 'won' ? <span className="text-green-600">+{b.profit}</span> : b.result === 'lost' ? <span className="text-red-600">{b.profit}</span> : <span className="text-gray-300">待定</span>}</span>
              </div>
            ))}
          </div>
        </div>
      })}
    </div>
  }

  return (
    <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
        <a href="/">BRORUSH</a><span>/</span>
        <a href="/projects/wcw2026" className="hover:text-gray-600">WCW2026</a><span>/</span>
        <span className="text-gray-600">盈亏</span>
      </div>
      <h1 className="text-xl font-bold mb-4">📊 盈亏统计</h1>
      {renderPnL(musBets, '木四', '#7c3aed', 'bg-purple-50/50')}
      {renderPnL(tkBets, '听课', '#2563eb', 'bg-blue-50/50')}
    </div>
  )
}
