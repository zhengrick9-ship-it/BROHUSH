'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function WCW2026Page() {
  const [matches, setMatches] = useState<any[]>([])
  const [bets, setBets] = useState<any[]>([])
  const [me, setMe] = useState('')

  useEffect(() => {
    setMe(localStorage.getItem('brorush_name') || '')
    fetch('/api/data').then(r => r.json()).then(d => { setMatches(d.matches); setBets(d.bets) })
  }, [])

  const musBets = bets.filter(b => b.person === '木四')
  const tkBets = bets.filter(b => b.person === '听课')
  const calc = (bs: any[]) => ({
    stake: bs.reduce((s, b) => s + b.stake, 0),
    profit: bs.reduce((s, b) => s + (b.profit || 0), 0),
    won: bs.filter(b => b.result === 'won').length,
    lost: bs.filter(b => b.result === 'lost').length,
  })
  const mus = calc(musBets), tk = calc(tkBets)

  if (!matches.length) {
    return <div className="flex min-h-screen items-center justify-center bg-[#0a0a08]"><div className="text-[#6f6e69] text-sm">载入中…</div></div>
  }

  const Person = ({ name, s }: { name: string, s: ReturnType<typeof calc> }) => {
    const roi = s.stake > 0 ? (s.profit / s.stake) * 100 : 0
    const pc = s.profit > 0 ? 'text-[#6fc28a]' : s.profit < 0 ? 'text-[#e07a64]' : 'text-[#f5f4ef]'
    return (
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <span className="font-medium text-[#f5f4ef]">{name}</span>
          {me === name && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#cc785c]/15 text-[#e0a08a]">我</span>}
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div><div className="text-[11px] text-[#6f6e69] mb-1">投入</div><div className="text-sm font-semibold font-mono-custom text-[#f5f4ef]">{s.stake}</div></div>
          <div><div className="text-[11px] text-[#6f6e69] mb-1">盈亏</div><div className={`text-sm font-semibold font-mono-custom ${pc}`}>{s.profit > 0 ? '+' : ''}{s.profit}</div></div>
          <div><div className="text-[11px] text-[#6f6e69] mb-1">ROI</div><div className={`text-sm font-semibold font-mono-custom ${pc}`}>{roi.toFixed(0)}%</div></div>
          <div><div className="text-[11px] text-[#6f6e69] mb-1">战绩</div><div className="text-sm font-semibold font-mono-custom text-[#f5f4ef]">{s.won}/{s.lost}</div></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-5 md:px-8 py-8">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[#cc785c]" />
          <Link href="/" className="text-sm font-medium text-[#f5f4ef]">BRORUSH</Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#6f6e69]">{me}</span>
          <button onClick={() => { localStorage.removeItem('brorush_name'); location.href = '/' }} className="nav-link text-sm">退出</button>
        </div>
      </div>

      <div className="mb-12">
        <p className="section-label mb-3">WCW2026 · 世界杯</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#f5f4ef] leading-tight">投注方案与赛果跟踪</h1>
        <p className="text-[#8f8e87] text-sm mt-3 leading-relaxed">{matches.length} 场比赛 · 模型推荐 · 双人投注与盈亏</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-12">
        <Person name="木四" s={mus} />
        <Person name="听课" s={tk} />
      </div>

      <div className="flex items-center gap-6 mb-6 border-b border-[#232320]">
        <span className="pb-3 text-sm font-medium text-[#f5f4ef] border-b-2 border-[#cc785c] -mb-px">赛程与推荐</span>
        <Link href="/projects/wcw2026/bets" className="pb-3 text-sm text-[#6f6e69] hover:text-[#b3b1a7] transition-colors">投注记录</Link>
        <Link href="/projects/wcw2026/pnl" className="pb-3 text-sm text-[#6f6e69] hover:text-[#b3b1a7] transition-colors">盈亏统计</Link>
      </div>

      <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-[11px] text-[#6f6e69] border-b border-[#232320]">
              <th className="pb-3 pr-4 font-medium">日期</th>
              <th className="pb-3 pr-4 font-medium">比赛</th>
              <th className="pb-3 pr-4 font-medium">推荐</th>
              <th className="pb-3 pr-4 font-medium">概率 H/D/A</th>
              <th className="pb-3 pr-4 font-medium">赔率 H/D/A</th>
              <th className="pb-3 pr-4 font-medium">边缘</th>
              <th className="pb-3 pr-4 font-medium">策略</th>
              <th className="pb-3 font-medium">赛果</th>
            </tr>
          </thead>
          <tbody>
            {matches.map(m => (
              <tr key={m.id} className="border-b border-[#1c1c19] hover:bg-white/[0.015] transition-colors">
                <td className="py-3 pr-4 text-xs text-[#6f6e69] font-mono-custom whitespace-nowrap">{m.match_date?.slice(5)}</td>
                <td className="py-3 pr-4 whitespace-nowrap"><span className="text-[#f5f4ef]">{m.home_team}</span><span className="text-[#3a3a36] mx-1.5">vs</span><span className="text-[#f5f4ef]">{m.away_team}</span></td>
                <td className="py-3 pr-4"><span className={`tag ${m.prediction === 'H' ? 'tag-h' : m.prediction === 'A' ? 'tag-a' : 'tag-d'}`}>{m.prediction === 'H' ? '主胜' : m.prediction === 'A' ? '客胜' : '平'}</span></td>
                <td className="py-3 pr-4 text-xs text-[#8f8e87] font-mono-custom whitespace-nowrap">{Math.round((m.model_prob_h || 0) * 100)}/{Math.round((m.model_prob_d || 0) * 100)}/{Math.round((m.model_prob_a || 0) * 100)}</td>
                <td className="py-3 pr-4 text-xs text-[#8f8e87] font-mono-custom whitespace-nowrap">{m.odds_h}/{m.odds_d}/{m.odds_a}</td>
                <td className="py-3 pr-4 text-xs font-mono-custom text-[#6fc28a] whitespace-nowrap">+{m.edge_pct}%</td>
                <td className="py-3 pr-4"><span className={`tag ${m.strategy_tag === 'CU' ? 'tag-cu' : m.strategy_tag === 'Value' ? 'tag-value' : 'tag-edge'}`}>{m.strategy_tag}</span></td>
                <td className="py-3 whitespace-nowrap">{m.match_status === 'finished' ? <span className={`text-sm font-semibold font-mono-custom ${m.actual_result === m.prediction ? 'text-[#6fc28a]' : 'text-[#e07a64]'}`}>{m.home_score}-{m.away_score}</span> : <span className="text-xs text-[#3a3a36]">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[#3a3a36] mt-12">BRORUSH · WCW2026</p>
    </div>
  )
}
