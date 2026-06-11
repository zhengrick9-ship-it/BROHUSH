'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function WCW2026Page() {
  const [matches, setMatches] = useState<any[]>([])
  const [bets, setBets] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => { setMatches(d.matches); setBets(d.bets) })
  }, [])

  const musBets = bets.filter(b => b.person === '木四')
  const tkBets = bets.filter(b => b.person === '听课')
  const calc = (bs: any[]) => ({ stake: bs.reduce((s, b) => s + b.stake, 0), profit: bs.reduce((s, b) => s + (b.profit || 0), 0), won: bs.filter(b => b.result === 'won').length, lost: bs.filter(b => b.result === 'lost').length })
  const mus = calc(musBets); const tk = calc(tkBets)

  if (!matches.length) return <div className="flex min-h-screen items-center justify-center bg-[#080808]"><div className="text-[#5e5d59]">加载中...</div></div>

  return (
    <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* 导航 */}
      <div className="flex items-center justify-between mb-8 pt-2">
        <div className="flex items-center gap-3 text-sm">
          <Link href="/" className="nav-link">← 首页</Link>
          <span className="text-[#3d3d3a]">/</span>
          <span className="text-[#f1f1ef]">WCW2026</span>
        </div>
        <span className="text-sm text-[#5e5d59]">{typeof window !== 'undefined' ? localStorage.getItem('brorush_name') : ''}</span>
      </div>

      <h1 className="text-2xl font-bold text-[#f1f1ef] mb-1">🌍 WCW2026 世界杯</h1>
      <p className="text-[#5e5d59] text-sm mb-8">24 场投注方案跟踪</p>

      {/* 双人概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3"><span>👤</span><span className="font-semibold text-[#f1f1ef]">木四</span></div>
          <div className="grid grid-cols-4 gap-3 text-sm">
            <div><div className="text-xs text-[#5e5d59]">投入</div><div className="font-semibold font-mono-custom text-[#f1f1ef]">{mus.stake}元</div></div>
            <div><div className="text-xs text-[#5e5d59]">盈亏</div><div className={`font-semibold font-mono-custom ${mus.profit > 0 ? 'text-[#4ade80]' : mus.profit < 0 ? 'text-[#f87171]' : ''}`}>{mus.profit > 0 ? '+' : ''}{mus.profit}</div></div>
            <div><div className="text-xs text-[#5e5d59]">ROI</div><div className={`font-semibold font-mono-custom ${mus.profit > 0 ? 'text-[#4ade80]' : mus.profit < 0 ? 'text-[#f87171]' : ''}`}>{mus.stake > 0 ? ((mus.profit/mus.stake)*100).toFixed(1) : '0'}%</div></div>
            <div><div className="text-xs text-[#5e5d59]">战绩</div><div className="font-semibold text-[#f1f1ef]">{mus.won}W {mus.lost}L</div></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3"><span>👤</span><span className="font-semibold text-[#f1f1ef]">听课</span></div>
          <div className="grid grid-cols-4 gap-3 text-sm">
            <div><div className="text-xs text-[#5e5d59]">投入</div><div className="font-semibold font-mono-custom text-[#f1f1ef]">{tk.stake}元</div></div>
            <div><div className="text-xs text-[#5e5d59]">盈亏</div><div className={`font-semibold font-mono-custom ${tk.profit > 0 ? 'text-[#4ade80]' : tk.profit < 0 ? 'text-[#f87171]' : ''}`}>{tk.profit > 0 ? '+' : ''}{tk.profit}</div></div>
            <div><div className="text-xs text-[#5e5d59]">ROI</div><div className={`font-semibold font-mono-custom ${tk.profit > 0 ? 'text-[#4ade80]' : tk.profit < 0 ? 'text-[#f87171]' : ''}`}>{tk.stake > 0 ? ((tk.profit/tk.stake)*100).toFixed(1) : '0'}%</div></div>
            <div><div className="text-xs text-[#5e5d59]">战绩</div><div className="font-semibold text-[#f1f1ef]">{tk.won}W {tk.lost}L</div></div>
          </div>
        </div>
      </div>

      {/* 标签 */}
      <div className="flex gap-4 mb-6 border-b border-[#1f1e1d]">
        <span className="px-1 pb-3 text-sm font-medium text-[#f1f1ef] border-b-2 border-[#146ef5]">📅 赛程</span>
        <Link href="/projects/wcw2026/bets" className="px-1 pb-3 text-sm text-[#5e5d59] hover:text-[#b0aea5] border-b-2 border-transparent transition-colors">💰 投注记录</Link>
        <Link href="/projects/wcw2026/pnl" className="px-1 pb-3 text-sm text-[#5e5d59] hover:text-[#b0aea5] border-b-2 border-transparent transition-colors">📊 盈亏</Link>
      </div>

      {/* 赛程 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-[#1f1e1d] text-left text-xs text-[#5e5d59]">
            <th className="pb-3 font-medium">日期</th><th className="pb-3 font-medium">组</th>
            <th className="pb-3 font-medium">比赛</th><th className="pb-3 font-medium">预测</th>
            <th className="pb-3 font-medium">赔率</th><th className="pb-3 font-medium">边缘</th>
            <th className="pb-3 font-medium">标签</th><th className="pb-3 font-medium">赛果</th>
          </tr></thead>
          <tbody>
            {matches.map(m => (
              <tr key={m.id} className="border-b border-[#1f1e1d]/50 hover:bg-white/[0.02] transition-colors">
                <td className="py-3 text-xs text-[#5e5d59] font-mono">{m.match_date?.slice(5)}</td>
                <td className="py-3 text-xs text-[#5e5d59]">{m.group_name}</td>
                <td className="py-3 text-sm"><span className="text-[#f1f1ef]">{m.home_team}</span><span className="text-[#3d3d3a] mx-1">vs</span><span className="text-[#f1f1ef]">{m.away_team}</span></td>
                <td className="py-3"><span className={`tag ${m.prediction === 'H' ? 'tag-h' : m.prediction === 'A' ? 'tag-a' : 'tag-d'}`}>{m.prediction === 'H' ? '主胜' : m.prediction === 'A' ? '客胜' : '平'}</span><div className="text-xs text-[#5e5d59] mt-0.5 font-mono">{Math.round((m.model_prob_h||0)*100)}/{Math.round((m.model_prob_d||0)*100)}/{Math.round((m.model_prob_a||0)*100)}</div></td>
                <td className="py-3 text-xs text-[#87867f] font-mono">{m.odds_h}/{m.odds_d}/{m.odds_a}</td>
                <td className="py-3 text-xs text-[#4ade80] font-medium font-mono">+{m.edge_pct}%</td>
                <td className="py-3"><span className={`tag ${m.strategy_tag === 'CU' ? 'tag-cu' : m.strategy_tag === 'Value' ? 'tag-value' : 'tag-edge'}`}>{m.strategy_tag}</span></td>
                <td className="py-3">{m.match_status === 'finished' ? <span className={`text-sm font-semibold ${m.actual_result === m.prediction ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>{m.home_score}-{m.away_score}</span> : <span className="text-xs text-[#3d3d3a]">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
