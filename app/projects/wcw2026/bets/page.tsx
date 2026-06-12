'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function BetsPage() {
  const [bets, setBets] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [me, setMe] = useState('')

  useEffect(() => {
    setMe(localStorage.getItem('brorush_name') || '')
    fetch('/api/data').then(r => r.json()).then(d => { setMatches(d.matches); setBets(d.bets) })
  }, [])

  const matchMap = new Map(matches.map(m => [m.id, m]))
  const musBets = bets.filter(b => b.person === '木四')
  const tkBets = bets.filter(b => b.person === '听课')

  const renderTable = (bs: any[], person: string) => (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <span className="font-medium text-[#f5f4ef]">{person}</span>
        {me === person && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#cc785c]/15 text-[#e0a08a]">我</span>}
        <span className="text-xs text-[#6f6e69] font-mono-custom">{bs.length} 注 · {bs.reduce((s, b) => s + b.stake, 0)} 元</span>
      </div>
      <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-[11px] text-[#6f6e69] border-b border-[#232320]">
              <th className="pb-3 pr-4 font-medium">日期</th>
              <th className="pb-3 pr-4 font-medium">比赛</th>
              <th className="pb-3 pr-4 font-medium">方向</th>
              <th className="pb-3 pr-4 font-medium">赔率</th>
              <th className="pb-3 pr-4 font-medium">金额</th>
              <th className="pb-3 pr-4 font-medium">结果</th>
              <th className="pb-3 font-medium">盈亏</th>
            </tr>
          </thead>
          <tbody>
            {bs.map(b => {
              const m = matchMap.get(b.match_id)
              return (
                <tr key={b.id} className="border-b border-[#1c1c19] hover:bg-white/[0.015] transition-colors">
                  <td className="py-3 pr-4 text-xs text-[#6f6e69] font-mono-custom whitespace-nowrap">{m?.match_date?.slice(5)}</td>
                  <td className="py-3 pr-4 text-[#b3b1a7] whitespace-nowrap">{m ? `${m.home_team} vs ${m.away_team}` : '-'}</td>
                  <td className="py-3 pr-4"><span className={`tag ${b.direction === 'H' ? 'tag-h' : b.direction === 'A' ? 'tag-a' : 'tag-d'}`}>{b.direction === 'H' ? '主胜' : b.direction === 'A' ? '客胜' : '平'}</span></td>
                  <td className="py-3 pr-4 text-[#b3b1a7] font-mono-custom">{b.odds}</td>
                  <td className="py-3 pr-4 text-[#b3b1a7] font-mono-custom">{b.stake}</td>
                  <td className="py-3 pr-4"><span className={`tag ${b.result === 'won' ? 'tag-win' : b.result === 'lost' ? 'tag-lose' : 'tag-pending'}`}>{b.result === 'won' ? '赢' : b.result === 'lost' ? '输' : '待定'}</span></td>
                  <td className={`py-3 font-mono-custom font-medium ${b.profit > 0 ? 'text-[#6fc28a]' : b.profit < 0 ? 'text-[#e07a64]' : 'text-[#6f6e69]'}`}>{b.result === 'pending' ? '—' : `${b.profit > 0 ? '+' : ''}${b.profit}`}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-5 md:px-8 py-8">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-2.5 text-sm">
          <Link href="/projects/wcw2026" className="nav-link">← WCW2026</Link>
          <span className="text-[#3a3a36]">/</span>
          <span className="text-[#f5f4ef]">投注记录</span>
        </div>
        <span className="text-sm text-[#6f6e69]">{me}</span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-[#f5f4ef] mb-8">投注记录</h1>
      {musBets.length > 0 && renderTable(musBets, '木四')}
      {tkBets.length > 0 && renderTable(tkBets, '听课')}
      {!bets.length && <p className="text-sm text-[#6f6e69]">载入中…</p>}
    </div>
  )
}
