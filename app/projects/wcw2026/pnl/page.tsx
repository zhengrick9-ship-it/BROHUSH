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

  const renderPnL = (bs: any[], person: string, accent: string, gradient: string) => {
    const s = calc(bs)
    const roi = s.stake > 0 ? (s.profit / s.stake) * 100 : 0
    const winRate = s.won + s.lost > 0 ? (s.won / (s.won + s.lost)) * 100 : 0
    const daily: Record<string, any[]> = {}
    bs.forEach(b => {
      const d = b.match?.match_date?.slice(5) || '未知'
      if (!daily[d]) daily[d] = []
      daily[d].push(b)
    })

    return <div className="mb-8 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <span>👤</span>
        <span className="font-semibold text-lg" style={{color:accent}}>{person}</span>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-4">
        <div className="glass rounded-xl p-3"><div className="text-xs text-white/30">总投入</div><div className="text-lg font-bold text-white font-mono-custom">{s.stake}元</div></div>
        <div className="glass rounded-xl p-3"><div className="text-xs text-white/30">净盈亏</div><div className={`text-lg font-bold font-mono-custom ${s.profit > 0 ? 'text-green-400' : s.profit < 0 ? 'text-red-400' : 'text-white'}`}>{s.profit > 0 ? '+' : ''}{s.profit}元</div></div>
        <div className="glass rounded-xl p-3"><div className="text-xs text-white/30">ROI</div><div className={`text-lg font-bold font-mono-custom ${roi > 0 ? 'text-green-400' : roi < 0 ? 'text-red-400' : 'text-white'}`}>{roi.toFixed(1)}%</div></div>
        <div className="glass rounded-xl p-3"><div className="text-xs text-white/30">胜率</div><div className="text-lg font-bold text-white font-mono-custom">{s.won+s.lost > 0 ? `${winRate.toFixed(1)}%` : '-'}</div></div>
        <div className="glass rounded-xl p-3"><div className="text-xs text-white/30">战绩</div><div className="text-lg font-bold text-white font-mono-custom">{s.won}W {s.lost}L</div></div>
      </div>

      {Object.entries(daily).sort().reverse().map(([date, dayBets]) => {
        const dp = dayBets.reduce((s, b) => s + (b.profit || 0), 0)
        const ds = dayBets.reduce((s, b) => s + b.stake, 0)
        return <div key={date} className="glass rounded-xl p-4 mb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm text-white/70">6/{date}</span>
            <span className={`text-sm font-mono ${dp > 0 ? 'text-green-400' : dp < 0 ? 'text-red-400' : 'text-white/30'}`}>
              投入 {ds}元 · 盈亏 {dp > 0 ? '+' : ''}{dp}元
            </span>
          </div>
          <div className="divide-y divide-white/[0.02] text-xs">
            {dayBets.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between py-2">
                <span className="text-white/60">{b.match?.home_team} vs {b.match?.away_team}</span>
                <span className="text-white/40 font-mono">
                  {b.stake}元 @{b.odds} {b.direction === 'H' ? '主胜' : b.direction === 'A' ? '客胜' : '平'}
                  <span className="ml-2">{b.result === 'won' ? <span className="text-green-400">+{b.profit}</span> : b.result === 'lost' ? <span className="text-red-400">{b.profit}</span> : <span className="text-white/20">待定</span>}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      })}
    </div>
  }

  return (
    <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full animate-fade-in">
      <div className="flex items-center gap-2 text-xs text-white/20 font-mono mb-1">
        <a href="/" className="hover:text-white/40">BRORUSH</a><span>/</span>
        <a href="/projects/wcw2026" className="hover:text-white/40">WCW2026</a><span>/</span>
        <span className="text-white/40">盈亏</span>
      </div>
      <h1 className="text-2xl font-bold text-white mb-6">📊 盈亏统计</h1>
      {renderPnL(musBets, '木四', '#a78bfa', 'from-purple-500/10')}
      {renderPnL(tkBets, '听课', '#60a5fa', 'from-blue-500/10')}
    </div>
  )
}
