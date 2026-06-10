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

  const renderTable = (bs: any[], person: string, color: string) => (
    <div className="mb-6">
      <h2 className="font-semibold text-sm mb-2" style={{color}}>👤 {person}</h2>
      <table className="w-full text-sm">
        <thead><tr className="border-b text-left text-gray-400 text-xs">
          <th className="pb-2 font-medium">日期</th><th className="pb-2 font-medium">比赛</th>
          <th className="pb-2 font-medium">方向</th><th className="pb-2 font-medium">赔率</th>
          <th className="pb-2 font-medium">金额</th><th className="pb-2 font-medium">结果</th><th className="pb-2 font-medium">盈亏</th>
        </tr></thead>
        <tbody>
          {bs.map(b => {
            const m = matchMap.get(b.match_id)
            return <tr key={b.id} className="border-b hover:bg-gray-50">
              <td className="py-2 text-xs">{m?.match_date?.slice(5)}</td>
              <td className="py-2 text-xs">{m ? `${m.home_team} vs ${m.away_team}` : '-'}</td>
              <td className="py-2"><span className={`text-xs font-medium px-1.5 py-0.5 rounded ${b.direction === 'H' ? 'bg-blue-100 text-blue-700' : b.direction === 'A' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{b.direction === 'H' ? '主胜' : b.direction === 'A' ? '客胜' : '平'}</span></td>
              <td className="py-2">{b.odds}</td>
              <td className="py-2">{b.stake}元</td>
              <td className="py-2"><span className={`text-xs px-1.5 py-0.5 rounded ${b.result === 'won' ? 'bg-green-100 text-green-700' : b.result === 'lost' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>{b.result === 'won' ? '✅' : b.result === 'lost' ? '❌' : '⏳'}</span></td>
              <td className={`py-2 font-medium ${b.profit > 0 ? 'text-green-600' : b.profit < 0 ? 'text-red-600' : ''}`}>{b.result === 'pending' ? '-' : `${b.profit > 0 ? '+' : ''}${b.profit}`}</td>
            </tr>
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
        <a href="/">BRORUSH</a><span>/</span>
        <a href="/projects/wcw2026" className="hover:text-gray-600">WCW2026</a><span>/</span>
        <span className="text-gray-600">投注</span>
      </div>
      <h1 className="text-xl font-bold mb-4">💰 投注记录</h1>
      {musBets.length > 0 && renderTable(musBets, '木四', '#7c3aed')}
      {tkBets.length > 0 && renderTable(tkBets, '听课', '#2563eb')}
    </div>
  )
}
