'use client'
import { useEffect, useState } from 'react'

export default function BetsPage() {
  const [bets, setBets] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => { setMatches(d.matches); setBets(d.bets) })
  }, [])

  const matchMap = new Map(matches.map(m => [m.id, m]))
  const musBets = bets.filter(b => b.person === '木四')
  const tkBets = bets.filter(b => b.person === '听课')

  const calc = (bs: any[]) => ({
    stake: bs.reduce((s, b) => s + b.stake, 0),
    profit: bs.reduce((s, b) => s + (b.profit || 0), 0),
    won: bs.filter(b => b.result === 'won').length,
    lost: bs.filter(b => b.result === 'lost').length,
  })
  const mus = calc(musBets); const tk = calc(tkBets)

  const renderTable = (bs: any[], person: string, accent: string) => (
    <div className="mb-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm">👤</span>
        <span className="font-semibold" style={{color:accent}}>{person}</span>
        <span className="text-xs text-white/30 font-mono">{bs.length}注 · {calc(bs).stake}元</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/5 text-left text-white/20 text-xs">
            <th className="pb-3 font-medium">日期</th><th className="pb-3 font-medium">比赛</th>
            <th className="pb-3 font-medium">方向</th><th className="pb-3 font-medium">赔率</th>
            <th className="pb-3 font-medium">金额</th><th className="pb-3 font-medium">结果</th><th className="pb-3 font-medium">盈亏</th>
          </tr></thead>
          <tbody>
            {bs.map(b => {
              const m = matchMap.get(b.match_id)
              return <tr key={b.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                <td className="py-3 text-xs text-white/30 font-mono">{m?.match_date?.slice(5)}</td>
                <td className="py-3 text-xs text-white/70">{m ? `${m.home_team} vs ${m.away_team}` : '-'}</td>
                <td className="py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-lg ${b.direction === 'H' ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20' : b.direction === 'A' ? 'bg-orange-500/10 text-orange-300 border border-orange-500/20' : 'bg-white/5 text-white/40 border border-white/10'}`}>
                    {b.direction === 'H' ? '主胜' : b.direction === 'A' ? '客胜' : '平'}
                  </span>
                </td>
                <td className="py-3 text-white/70 font-mono">{b.odds}</td>
                <td className="py-3 text-white/70 font-mono">{b.stake}元</td>
                <td className="py-3">
                  <span className={`text-xs px-2 py-1 rounded-lg ${b.result === 'won' ? 'bg-green-500/10 text-green-300' : b.result === 'lost' ? 'bg-red-500/10 text-red-300' : 'bg-white/5 text-white/30'}`}>{b.result === 'won' ? '✅ 赢' : b.result === 'lost' ? '❌ 输' : '⏳'}</span>
                </td>
                <td className={`py-3 font-mono ${b.profit > 0 ? 'text-green-400' : b.profit < 0 ? 'text-red-400' : 'text-white/30'}`}>{b.result === 'pending' ? '-' : `${b.profit > 0 ? '+' : ''}${b.profit}`}</td>
              </tr>
            })}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full animate-fade-in">
      <div className="flex items-center gap-2 text-xs text-white/20 font-mono mb-1">
        <a href="/" className="hover:text-white/40">BRORUSH</a><span>/</span>
        <a href="/projects/wcw2026" className="hover:text-white/40">WCW2026</a><span>/</span>
        <span className="text-white/40">投注</span>
      </div>
      <h1 className="text-2xl font-bold text-white mb-6">💰 投注记录</h1>

      {musBets.length > 0 && renderTable(musBets, '木四', '#a78bfa')}
      {tkBets.length > 0 && renderTable(tkBets, '听课', '#60a5fa')}
    </div>
  )
}
