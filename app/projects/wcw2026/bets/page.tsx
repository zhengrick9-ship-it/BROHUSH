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

  const renderTable = (bs: any[], person: string) => (
    <div className="mb-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <span>👤</span>
        <span className="font-semibold text-gray-900">{person}</span>
        <span className="text-xs text-gray-400 font-mono">{bs.length}注 · {bs.reduce((s,b) => s+b.stake, 0)}元</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 text-left text-xs text-gray-400">
            <th className="pb-3 font-medium">日期</th><th className="pb-3 font-medium">比赛</th>
            <th className="pb-3 font-medium">方向</th><th className="pb-3 font-medium">赔率</th>
            <th className="pb-3 font-medium">金额</th><th className="pb-3 font-medium">结果</th><th className="pb-3 font-medium">盈亏</th>
          </tr></thead>
          <tbody>
            {bs.map(b => {
              const m = matchMap.get(b.match_id)
              return <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-3 text-xs text-gray-400 font-mono">{m?.match_date?.slice(5)}</td>
                <td className="py-3 text-sm text-gray-700">{m ? `${m.home_team} vs ${m.away_team}` : '-'}</td>
                <td className="py-3">
                  <span className={`tag ${b.direction === 'H' ? 'tag-h' : b.direction === 'A' ? 'tag-a' : 'tag-d'}`}>
                    {b.direction === 'H' ? '主胜' : b.direction === 'A' ? '客胜' : '平'}
                  </span>
                </td>
                <td className="py-3 text-gray-700 font-mono">{b.odds}</td>
                <td className="py-3 text-gray-700 font-mono">{b.stake}元</td>
                <td className="py-3">
                  <span className={`tag ${b.result === 'won' ? 'tag-win' : b.result === 'lost' ? 'tag-lose' : 'tag-pending'}`}>
                    {b.result === 'won' ? '✅ 赢' : b.result === 'lost' ? '❌ 输' : '⏳'}
                  </span>
                </td>
                <td className={`py-3 font-mono font-medium ${b.profit > 0 ? 'text-green-600' : b.profit < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {b.result === 'pending' ? '-' : `${b.profit > 0 ? '+' : ''}${b.profit}`}
                </td>
              </tr>
            })}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 text-sm">
          <a href="/" className="text-gray-400 hover:text-gray-600 transition-colors">← 首页</a>
          <span className="text-gray-200">/</span>
          <a href="/projects/wcw2026" className="text-gray-400 hover:text-gray-600 transition-colors">WCW2026</a>
          <span className="text-gray-200">/</span>
          <span className="text-gray-900 font-medium">投注</span>
        </div>
        <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-md">
          {typeof window !== 'undefined' ? localStorage.getItem('brorush_name') : ''}
        </span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">💰 投注记录</h1>
      {musBets.length > 0 && renderTable(musBets, '木四')}
      {tkBets.length > 0 && renderTable(tkBets, '听课')}
    </div>
  )
}
