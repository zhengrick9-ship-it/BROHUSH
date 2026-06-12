'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function WCW2026Page() {
  const [matches, setMatches] = useState<any[]>([])
  const [bets, setBets] = useState<any[]>([])
  const [me, setMe] = useState('')
  const [tab, setTab] = useState<'matches' | 'bets' | 'pnl'>('matches')

  useEffect(() => {
    setMe(localStorage.getItem('brorush_name') || '')
    fetch('/api/data').then(r => r.json()).then(d => {
      const sorted = [...(d.matches || [])].sort((a, b) =>
        (a.match_date || '').localeCompare(b.match_date || '') || (a.id - b.id))
      setMatches(sorted)
      setBets(d.bets || [])
    })
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
  const mus = calc(musBets), tk = calc(tkBets)

  if (!matches.length) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f5f1e9]"><div className="text-[#8a887f] text-sm">载入中…</div></div>
  }

  const Person = ({ name, s }: { name: string, s: ReturnType<typeof calc> }) => {
    const roi = s.stake > 0 ? (s.profit / s.stake) * 100 : 0
    const pc = s.profit > 0 ? 'text-[#2f8a52]' : s.profit < 0 ? 'text-[#c44c38]' : 'text-[#1a1a17]'
    return (
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <span className="font-medium text-[#1a1a17]">{name}</span>
          {me === name && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#cc785c]/15 text-[#b5654a]">我</span>}
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div><div className="text-[11px] text-[#8a887f] mb-1">投入</div><div className="text-sm font-semibold font-mono-custom text-[#1a1a17]">{s.stake}</div></div>
          <div><div className="text-[11px] text-[#8a887f] mb-1">盈亏</div><div className={`text-sm font-semibold font-mono-custom ${pc}`}>{s.profit > 0 ? '+' : ''}{s.profit}</div></div>
          <div><div className="text-[11px] text-[#8a887f] mb-1">ROI</div><div className={`text-sm font-semibold font-mono-custom ${pc}`}>{roi.toFixed(0)}%</div></div>
          <div><div className="text-[11px] text-[#8a887f] mb-1">战绩</div><div className="text-sm font-semibold font-mono-custom text-[#1a1a17]">{s.won}/{s.lost}</div></div>
        </div>
      </div>
    )
  }

  const Tab = ({ id, label }: { id: typeof tab, label: string }) => (
    <button onClick={() => setTab(id)} className={`pb-3 text-sm transition-colors -mb-px border-b-2 ${tab === id ? 'font-medium text-[#1a1a17] border-[#cc785c]' : 'text-[#8a887f] hover:text-[#1a1a17] border-transparent'}`}>{label}</button>
  )

  const betRows = (bs: any[]) => bs.map(b => {
    const m = matchMap.get(b.match_id)
    return (
      <tr key={b.id} className="border-b border-[#efe9dd] hover:bg-black/[0.015] transition-colors">
        <td className="py-3 pr-4 text-xs text-[#8a887f] font-mono-custom whitespace-nowrap">{m?.match_date?.slice(5)}</td>
        <td className="py-3 pr-4 text-[#57564f] whitespace-nowrap">{m ? `${m.home_team} vs ${m.away_team}` : '-'}</td>
        <td className="py-3 pr-4"><span className={`tag ${b.direction === 'H' ? 'tag-h' : b.direction === 'A' ? 'tag-a' : 'tag-d'}`}>{b.direction === 'H' ? '主胜' : b.direction === 'A' ? '客胜' : '平'}</span></td>
        <td className="py-3 pr-4 text-[#57564f] font-mono-custom">{b.odds}</td>
        <td className="py-3 pr-4 text-[#57564f] font-mono-custom">{b.stake}</td>
        <td className="py-3 pr-4"><span className={`tag ${b.result === 'won' ? 'tag-win' : b.result === 'lost' ? 'tag-lose' : 'tag-pending'}`}>{b.result === 'won' ? '赢' : b.result === 'lost' ? '输' : '待定'}</span></td>
        <td className={`py-3 font-mono-custom font-medium ${b.profit > 0 ? 'text-[#2f8a52]' : b.profit < 0 ? 'text-[#c44c38]' : 'text-[#8a887f]'}`}>{b.result === 'pending' ? '—' : `${b.profit > 0 ? '+' : ''}${b.profit}`}</td>
      </tr>
    )
  })

  const BetBlock = ({ name, bs }: { name: string, bs: any[] }) => (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <span className="font-medium text-[#1a1a17]">{name}</span>
        {me === name && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#cc785c]/15 text-[#b5654a]">我</span>}
        <span className="text-xs text-[#8a887f] font-mono-custom">{bs.length} 注 · {bs.reduce((s, b) => s + b.stake, 0)} 元</span>
      </div>
      {bs.length ? (
        <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="text-left text-[11px] text-[#8a887f] border-b border-[#e6e1d6]">
              <th className="pb-3 pr-4 font-medium">日期</th><th className="pb-3 pr-4 font-medium">比赛</th>
              <th className="pb-3 pr-4 font-medium">方向</th><th className="pb-3 pr-4 font-medium">赔率</th>
              <th className="pb-3 pr-4 font-medium">金额</th><th className="pb-3 pr-4 font-medium">结果</th><th className="pb-3 font-medium">盈亏</th>
            </tr></thead>
            <tbody>{betRows(bs)}</tbody>
          </table>
        </div>
      ) : <p className="text-sm text-[#8a887f]">暂无投注记录</p>}
    </div>
  )

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-5 md:px-8 py-8">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[#cc785c]" />
          <Link href="/" className="text-sm font-medium text-[#1a1a17]">BRORUSH</Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#8a887f]">{me}</span>
          <button onClick={() => { localStorage.removeItem('brorush_name'); location.href = '/' }} className="nav-link text-sm">退出</button>
        </div>
      </div>

      <div className="mb-10">
        <p className="section-label mb-3">WCW2026 · 世界杯</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#1a1a17] leading-tight">投注方案与赛果跟踪</h1>
        <p className="text-[#8a887f] text-sm mt-3 leading-relaxed">{matches.length} 场比赛 · 模型推荐 · 双人投注与盈亏</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
        <Person name="木四" s={mus} />
        <Person name="听课" s={tk} />
      </div>

      <div className="flex items-center gap-6 mb-6 border-b border-[#e6e1d6]">
        <Tab id="matches" label="赛程与推荐" />
        <Tab id="bets" label="投注记录" />
        <Tab id="pnl" label="盈亏统计" />
      </div>

      {tab === 'matches' && (
        <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0 animate-fade-in">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-[11px] text-[#8a887f] border-b border-[#e6e1d6]">
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
                <tr key={m.id} className="border-b border-[#efe9dd] hover:bg-black/[0.015] transition-colors">
                  <td className="py-3 pr-4 text-xs text-[#8a887f] font-mono-custom whitespace-nowrap">{m.match_date?.slice(5)}</td>
                  <td className="py-3 pr-4 whitespace-nowrap"><span className="text-[#1a1a17]">{m.home_team}</span><span className="text-[#c9c3b5] mx-1.5">vs</span><span className="text-[#1a1a17]">{m.away_team}</span></td>
                  <td className="py-3 pr-4"><span className={`tag ${m.prediction === 'H' ? 'tag-h' : m.prediction === 'A' ? 'tag-a' : 'tag-d'}`}>{m.prediction === 'H' ? '主胜' : m.prediction === 'A' ? '客胜' : '平'}</span></td>
                  <td className="py-3 pr-4 text-xs text-[#57564f] font-mono-custom whitespace-nowrap">{Math.round((m.model_prob_h || 0) * 100)}/{Math.round((m.model_prob_d || 0) * 100)}/{Math.round((m.model_prob_a || 0) * 100)}</td>
                  <td className="py-3 pr-4 text-xs text-[#57564f] font-mono-custom whitespace-nowrap">{m.odds_h}/{m.odds_d}/{m.odds_a}</td>
                  <td className="py-3 pr-4 text-xs font-mono-custom text-[#2f8a52] whitespace-nowrap">+{m.edge_pct}%</td>
                  <td className="py-3 pr-4"><span className={`tag ${m.strategy_tag === 'CU' ? 'tag-cu' : m.strategy_tag === 'Value' ? 'tag-value' : 'tag-edge'}`}>{m.strategy_tag}</span></td>
                  <td className="py-3 whitespace-nowrap">{m.match_status === 'finished' ? <span className={`text-sm font-semibold font-mono-custom ${m.actual_result === m.prediction ? 'text-[#2f8a52]' : 'text-[#c44c38]'}`}>{m.home_score}-{m.away_score}</span> : <span className="text-xs text-[#c9c3b5]">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'bets' && (
        <div className="animate-fade-in">
          <BetBlock name="木四" bs={musBets} />
          <BetBlock name="听课" bs={tkBets} />
        </div>
      )}

      {tab === 'pnl' && (
        <div className="animate-fade-in">
          <PnLBlock name="木四" bs={musBets} matchMap={matchMap} me={me} />
          <PnLBlock name="听课" bs={tkBets} matchMap={matchMap} me={me} />
        </div>
      )}

      <p className="text-xs text-[#b8b3a6] mt-12">BRORUSH · WCW2026</p>
    </div>
  )
}

function PnLBlock({ name, bs, matchMap, me }: { name: string, bs: any[], matchMap: Map<any, any>, me: string }) {
  const s = {
    stake: bs.reduce((a, b) => a + b.stake, 0),
    profit: bs.reduce((a, b) => a + (b.profit || 0), 0),
    won: bs.filter(b => b.result === 'won').length,
    lost: bs.filter(b => b.result === 'lost').length,
  }
  const roi = s.stake > 0 ? (s.profit / s.stake) * 100 : 0
  const winRate = s.won + s.lost > 0 ? (s.won / (s.won + s.lost)) * 100 : 0
  const pc = s.profit > 0 ? 'text-[#2f8a52]' : s.profit < 0 ? 'text-[#c44c38]' : 'text-[#1a1a17]'
  const daily: Record<string, any[]> = {}
  bs.forEach(b => {
    const m = matchMap.get(b.match_id)
    const d = m?.match_date?.slice(5) || '未知'
    if (!daily[d]) daily[d] = []
    daily[d].push({ ...b, match: m })
  })

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <span className="font-medium text-[#1a1a17]">{name}</span>
        {me === name && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#cc785c]/15 text-[#b5654a]">我</span>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        <div className="stat-card"><div className="text-[11px] text-[#8a887f] mb-1">总投入</div><div className="text-lg font-semibold text-[#1a1a17] font-mono-custom">{s.stake}</div></div>
        <div className="stat-card"><div className="text-[11px] text-[#8a887f] mb-1">净盈亏</div><div className={`text-lg font-semibold font-mono-custom ${pc}`}>{s.profit > 0 ? '+' : ''}{s.profit}</div></div>
        <div className="stat-card"><div className="text-[11px] text-[#8a887f] mb-1">ROI</div><div className={`text-lg font-semibold font-mono-custom ${pc}`}>{roi.toFixed(1)}%</div></div>
        <div className="stat-card"><div className="text-[11px] text-[#8a887f] mb-1">胜率</div><div className="text-lg font-semibold text-[#1a1a17] font-mono-custom">{s.won + s.lost > 0 ? `${winRate.toFixed(0)}%` : '-'}</div></div>
        <div className="stat-card"><div className="text-[11px] text-[#8a887f] mb-1">战绩</div><div className="text-lg font-semibold text-[#1a1a17] font-mono-custom">{s.won}W {s.lost}L</div></div>
      </div>
      {Object.entries(daily).sort().map(([date, dayBets]) => {
        const dp = dayBets.reduce((sum, b) => sum + (b.profit || 0), 0)
        const ds = dayBets.reduce((sum, b) => sum + b.stake, 0)
        return (
          <div key={date} className="card p-4 mb-2">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-sm text-[#57564f]">{date}</span>
              <span className={`text-xs font-mono-custom ${dp > 0 ? 'text-[#2f8a52]' : dp < 0 ? 'text-[#c44c38]' : 'text-[#8a887f]'}`}>投入 {ds} · 盈亏 {dp > 0 ? '+' : ''}{dp}</span>
            </div>
            <div className="divide-y divide-[#efe9dd] text-sm">
              {dayBets.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between py-2">
                  <span className="text-[#57564f]">{b.match?.home_team} vs {b.match?.away_team}</span>
                  <span className="text-[#8a887f] font-mono-custom text-xs">
                    {b.stake} @{b.odds} {b.direction === 'H' ? '主胜' : b.direction === 'A' ? '客胜' : '平'}
                    <span className="ml-2">{b.result === 'won' ? <span className="text-[#2f8a52] font-medium">+{b.profit}</span> : b.result === 'lost' ? <span className="text-[#c44c38] font-medium">{b.profit}</span> : <span className="text-[#c9c3b5]">待定</span>}</span>
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
