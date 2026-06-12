'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function PnLPage() {
  const [bets, setBets] = useState<any[]>([])
  const [me, setMe] = useState('')

  useEffect(() => {
    setMe(localStorage.getItem('brorush_name') || '')
    fetch('/api/data').then(r => r.json()).then(d => {
      const mm = new Map(d.matches.map((x: any) => [x.id, x]))
      setBets(d.bets.map((b: any) => ({ ...b, match: mm.get(b.match_id) })))
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

  const renderPnL = (bs: any[], person: string) => {
    const s = calc(bs)
    const roi = s.stake > 0 ? (s.profit / s.stake) * 100 : 0
    const winRate = s.won + s.lost > 0 ? (s.won / (s.won + s.lost)) * 100 : 0
    const pc = s.profit > 0 ? 'text-[#6fc28a]' : s.profit < 0 ? 'text-[#e07a64]' : 'text-[#f5f4ef]'
    const rc = roi > 0 ? 'text-[#6fc28a]' : roi < 0 ? 'text-[#e07a64]' : 'text-[#f5f4ef]'
    const daily: Record<string, any[]> = {}
    bs.forEach(b => {
      const d = b.match?.match_date?.slice(5) || '未知'
      if (!daily[d]) daily[d] = []
      daily[d].push(b)
    })

    return (
      <div className="mb-12 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <span className="font-medium text-[#f5f4ef]">{person}</span>
          {me === person && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#cc785c]/15 text-[#e0a08a]">我</span>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
          <div className="stat-card"><div className="text-[11px] text-[#6f6e69] mb-1">总投入</div><div className="text-lg font-semibold text-[#f5f4ef] font-mono-custom">{s.stake}</div></div>
          <div className="stat-card"><div className="text-[11px] text-[#6f6e69] mb-1">净盈亏</div><div className={`text-lg font-semibold font-mono-custom ${pc}`}>{s.profit > 0 ? '+' : ''}{s.profit}</div></div>
          <div className="stat-card"><div className="text-[11px] text-[#6f6e69] mb-1">ROI</div><div className={`text-lg font-semibold font-mono-custom ${rc}`}>{roi.toFixed(1)}%</div></div>
          <div className="stat-card"><div className="text-[11px] text-[#6f6e69] mb-1">胜率</div><div className="text-lg font-semibold text-[#f5f4ef] font-mono-custom">{s.won + s.lost > 0 ? `${winRate.toFixed(0)}%` : '-'}</div></div>
          <div className="stat-card"><div className="text-[11px] text-[#6f6e69] mb-1">战绩</div><div className="text-lg font-semibold text-[#f5f4ef] font-mono-custom">{s.won}W {s.lost}L</div></div>
        </div>

        {Object.entries(daily).sort().reverse().map(([date, dayBets]) => {
          const dp = dayBets.reduce((sum, b) => sum + (b.profit || 0), 0)
          const ds = dayBets.reduce((sum, b) => sum + b.stake, 0)
          return (
            <div key={date} className="card p-4 mb-2">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-sm text-[#b3b1a7]">6/{date}</span>
                <span className={`text-xs font-mono-custom ${dp > 0 ? 'text-[#6fc28a]' : dp < 0 ? 'text-[#e07a64]' : 'text-[#6f6e69]'}`}>
                  投入 {ds} · 盈亏 {dp > 0 ? '+' : ''}{dp}
                </span>
              </div>
              <div className="divide-y divide-[#1c1c19] text-sm">
                {dayBets.map((b: any) => (
                  <div key={b.id} className="flex items-center justify-between py-2">
                    <span className="text-[#b3b1a7]">{b.match?.home_team} vs {b.match?.away_team}</span>
                    <span className="text-[#6f6e69] font-mono-custom text-xs">
                      {b.stake} @{b.odds} {b.direction === 'H' ? '主胜' : b.direction === 'A' ? '客胜' : '平'}
                      <span className="ml-2">{b.result === 'won' ? <span className="text-[#6fc28a] font-medium">+{b.profit}</span> : b.result === 'lost' ? <span className="text-[#e07a64] font-medium">{b.profit}</span> : <span className="text-[#3a3a36]">待定</span>}</span>
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

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-5 md:px-8 py-8">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-2.5 text-sm">
          <Link href="/projects/wcw2026" className="nav-link">← WCW2026</Link>
          <span className="text-[#3a3a36]">/</span>
          <span className="text-[#f5f4ef]">盈亏统计</span>
        </div>
        <span className="text-sm text-[#6f6e69]">{me}</span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-[#f5f4ef] mb-8">盈亏统计</h1>
      {bets.length > 0 ? (
        <>
          {renderPnL(musBets, '木四')}
          {renderPnL(tkBets, '听课')}
        </>
      ) : <p className="text-sm text-[#6f6e69]">载入中…</p>}
    </div>
  )
}
