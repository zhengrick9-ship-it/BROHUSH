'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { CapitalLines } from '@/app/components/CapitalLines'
import { DogMark } from '@/app/components/DogMark'
import {
  betPayout,
  getRoundKey,
  settleBet,
  settleTicket,
  summarizeBets,
} from '@/lib/wcw2026/metrics'
import type { Bet, Match, Outcome, TicketRecord } from '@/lib/wcw2026/types'

type DataResponse = {
  matches: Match[]
  bets: Bet[]
  tickets: TicketRecord[]
  canEdit: boolean
  editorName: string
  error?: string
}

export default function WCW2026Page() {
  const [matches, setMatches] = useState<Match[]>([])
  const [bets, setBets] = useState<Bet[]>([])
  const [tickets, setTickets] = useState<TicketRecord[]>([])
  const [me, setMe] = useState('')
  const [canEdit, setCanEdit] = useState(false)
  const [activeRound, setActiveRound] = useState('')
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  const loadData = async () => {
    const token = sessionStorage.getItem('twodogs_session_token')
    if (!token) {
      router.replace('/')
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/data', {
        cache: 'no-store',
        headers: { 'x-session-token': token },
      })
      const body = (await response.json()) as DataResponse
      if (!response.ok) throw new Error(body.error || '数据读取失败')
      setMatches(body.matches)
      setBets(body.bets)
      setTickets(body.tickets)
      setCanEdit(body.canEdit)
      setMe(body.editorName)
    } catch (loadError) {
      if (
        loadError instanceof Error &&
        loadError.message === '请重新登录'
      ) {
        router.replace('/')
        return
      }
      setError(loadError instanceof Error ? loadError.message : '数据读取失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const matchMap = useMemo(
    () => new Map(matches.map((match) => [match.id, match])),
    [matches],
  )
  const settledBets = useMemo(
    () => bets.map((bet) => settleBet(bet, matchMap.get(bet.match_id))),
    [bets, matchMap],
  )
  const betMap = useMemo(() => {
    const map = new Map<string, Bet[]>()
    settledBets.forEach((bet) => {
      map.set(bet.match_id, [...(map.get(bet.match_id) || []), bet])
    })
    return map
  }, [settledBets])
  const settledTickets = useMemo(
    () => tickets.map((ticket) => settleTicket(ticket, matches)),
    [matches, tickets],
  )
  const summary = useMemo(
    () => summarizeBets(settledBets, settledTickets),
    [settledBets, settledTickets],
  )
  const rounds = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getRoundKey>>()
    matches.forEach((match) => {
      const round = getRoundKey(match)
      map.set(round.id, round)
    })
    return [...map.values()].sort((a, b) => a.order - b.order)
  }, [matches])

  useEffect(() => {
    if (!activeRound && rounds.length) {
      const firstPending = rounds.find((round) =>
        matches.some(
          (match) =>
            getRoundKey(match).id === round.id &&
            match.match_status !== 'finished',
        ),
      )
      setActiveRound(firstPending?.id || rounds[0].id)
    }
  }, [activeRound, matches, rounds])

  const visibleMatches = matches
    .filter((match) => getRoundKey(match).id === activeRound)
    .sort((a, b) =>
      (a.kickoff_at || a.match_date).localeCompare(
        b.kickoff_at || b.match_date,
      ),
    )

  const logout = async () => {
    sessionStorage.removeItem('twodogs_session_token')
    await fetch('/api/session', { method: 'DELETE' })
    router.replace('/')
  }

  if (loading) return <StatusScreen>正在整理 104 场赛程…</StatusScreen>
  if (error) {
    return (
      <StatusScreen>
        <p>{error}</p>
        <button className="text-button mt-4" onClick={loadData}>
          重新载入
        </button>
      </StatusScreen>
    )
  }

  return (
    <main className="min-h-screen pb-16">
      <header className="site-header">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 text-[var(--accent)]"
          >
            <DogMark compact />
            <span className="text-xs font-semibold tracking-[0.2em] text-[var(--text)]">
              3DOGS
            </span>
          </button>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[var(--muted)]">YO BRO · {me}</span>
            <button className="text-button" onClick={logout}>
              退出
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <section className="hero-grid">
          <h1 className="font-display text-4xl tracking-[-0.03em] text-[var(--text)] md:text-6xl">
            WCW2026
          </h1>
        </section>

        <section className="metric-grid metric-grid-wide">
          <Metric
            label="状态"
            value={<MoodFace value={summary.settledProfit} size="large" />}
          />
          <Metric label="累计投入" value={money(summary.totalStake)} unit="元" />
          <Metric label="完赛成本" value={money(summary.settledStake)} unit="元" />
          <Metric
            label="完赛奖金"
            value={money(summary.settledPayout)}
            tone={summary.settledPayout - summary.settledStake}
            unit="元"
          />
          <Metric
            label="净收益"
            value={signedMoney(summary.settledProfit)}
            tone={summary.settledProfit}
            unit="元"
          />
          <Metric
            label="ROI"
            value={`${summary.roi > 0 ? '+' : ''}${summary.roi.toFixed(1)}%`}
            tone={summary.roi}
          />
          <Metric
            label="战绩"
            value={`${summary.won}W ${summary.lost}L`}
            note={`${summary.pending} 场待定`}
          />
        </section>

        <CapitalLines summary={summary} />

        <section className="mt-7">
          <div className="mb-4 flex items-end justify-between gap-5">
            <h2 className="font-display text-2xl text-[var(--text)]">串关</h2>
            <span className="text-xs text-[var(--muted)]">
              共 {settledTickets.length} 单 · {money(settledTickets.reduce((sum, ticket) => sum + ticket.stake, 0))} 元
            </span>
          </div>
          <div className="ticket-grid">
            {settledTickets.map((ticket, index) => (
              <article key={ticket.id} className="ticket-card group">
                <MoodFace value={ticket.result === 'pending' ? 0 : ticket.profit} />
                <div>
                  <p className="font-medium text-[var(--text)]">
                    #{ticket.ticketNumber || index + 1} · {ticket.label}
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {new Set(ticket.legs.map((leg) => leg.sourceMatchNumber)).size} 场 · 成本 {money(ticket.stake)} 元
                  </p>
                </div>
                <div className="text-right">
                  {ticket.result === 'pending' ? (
                    <>
                      <p className="text-xs text-[var(--muted)]">理论净收益</p>
                      <p className="font-display text-xl">
                        {signedMoney(ticket.minProfit || 0)} ～ {signedMoney(ticket.maxProfit || 0)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-[var(--muted)]">
                        奖金 {money(ticket.payout || 0)}
                      </p>
                      <p className={`font-display text-xl ${ticket.profit >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                        净收益 {signedMoney(ticket.profit)}
                      </p>
                    </>
                  )}
                </div>
                <TicketDetails ticket={ticket} matches={matches} />
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-5">
            <h2 className="font-display text-3xl text-[var(--text)]">赛程 / 单关</h2>
            <p className="text-xs text-[var(--muted)]">
              {matches.length} 场比赛 · {settledBets.length} 场已投注
            </p>
          </div>

          <div className="round-tabs" role="tablist" aria-label="比赛轮次">
            {rounds.map((round) => {
              const count = matches.filter(
                (match) => getRoundKey(match).id === round.id,
              ).length
              return (
                <button
                  key={round.id}
                  role="tab"
                  aria-selected={activeRound === round.id}
                  className={`round-tab ${activeRound === round.id ? 'is-active' : ''}`}
                  onClick={() => setActiveRound(round.id)}
                >
                  <span>{round.label}</span>
                  <small>{count}</small>
                </button>
              )
            })}
          </div>

          <div className="match-list">
            <div className="match-head hidden md:grid">
              <span />
              <span>时间 / 对阵</span>
              <span>单关 / 让球赔率</span>
              <span>实际投注</span>
              <span>投注金额</span>
              <span>赛果</span>
              <span>奖金</span>
              <span>净收益</span>
              <span />
            </div>
            {visibleMatches.map((match) => (
              <MatchRow
                key={match.id}
                match={match}
                bets={betMap.get(match.id) || []}
                canEdit={canEdit}
                onEdit={() => setEditingMatch(match)}
              />
            ))}
          </div>
        </section>

        <footer className="mt-16 border-t border-[var(--line)] py-7 text-xs text-[var(--muted)]">
          <span>3DOGS · WCW2026</span>
        </footer>
      </div>

      {editingMatch && (
        <EditDrawer
          match={editingMatch}
          bets={betMap.get(editingMatch.id) || []}
          onClose={() => setEditingMatch(null)}
          onSaved={async () => {
            await loadData()
            setEditingMatch(null)
          }}
        />
      )}
    </main>
  )
}

function Metric({
  label,
  value,
  unit,
  note,
  tone = 0,
}: {
  label: string
  value: React.ReactNode
  unit?: string
  note?: string
  tone?: number
}) {
  const color =
    tone > 0 ? 'text-[var(--green)]' : tone < 0 ? 'text-[var(--red)]' : ''
  return (
    <article className="metric">
      <p className="section-label">{label}</p>
      <div className={`mt-3 font-display text-4xl ${color}`}>
        {value}
        {unit && <span className="ml-1 text-sm text-[var(--muted)]">{unit}</span>}
      </div>
      {note && <p className="mt-2 text-xs text-[var(--muted)]">{note}</p>}
    </article>
  )
}

function MatchRow({
  match,
  bets,
  canEdit,
  onEdit,
}: {
  match: Match
  bets: Bet[]
  canEdit: boolean
  onEdit: () => void
}) {
  const totalStake =
    bets.reduce((sum, bet) => sum + bet.stake, 0)
  const totalProfit =
    bets.reduce((sum, bet) => sum + bet.profit, 0)
  const totalPayout = bets.reduce((sum, bet) => sum + betPayout(bet), 0)
  const allSettled = bets.length > 0 && bets.every((bet) => bet.result !== 'pending')
  return (
    <article className="match-row">
      <MoodFace value={allSettled ? totalProfit : 0} />
      <div className="min-w-0">
        <p className="mb-1 text-[11px] tracking-[0.08em] text-[var(--muted)]">
          {formatKickoff(match)}
          {match.group_name ? ` · ${match.group_name} 组` : ''}
          {match.source_match_number
            ? ` · M${match.source_match_number}`
            : ''}
        </p>
        <p className="truncate font-medium text-[var(--text)]">
          {match.home_team}
          <span className="mx-2 font-normal text-[var(--faint)]">vs</span>
          {match.away_team}
        </p>
      </div>
      <DataCell label="单关 / 让球赔率">
        <OddsLine label="单" h={match.odds_h} d={match.odds_d} a={match.odds_a} />
        <OddsLine
          label={`让${formatHandicap(match.handicap_value)}`}
          h={match.odds_handicap_h}
          d={match.odds_handicap_d}
          a={match.odds_handicap_a}
        />
      </DataCell>
      <DataCell label="实际投注">
        {bets.length ? (
          <span className="flex flex-wrap gap-1.5">
            {bets.map((bet) => (
              <span key={bet.id}>
                <small className="mr-1 text-[var(--muted)]">
                  {betSourceLabel(bet)}
                </small>
                <OutcomeTag outcome={bet.direction} />
                <small className="ml-1 text-[var(--muted)]">@{bet.odds}</small>
              </span>
            ))}
          </span>
        ) : (
          <Muted>未投注</Muted>
        )}
      </DataCell>
      <DataCell label="投注金额">
        {bets.length ? `${money(totalStake)} 元` : <Muted>—</Muted>}
      </DataCell>
      <DataCell label="赛果">
        {match.match_status === 'finished' ? (
          <span className="font-display text-lg">
            {match.home_score} : {match.away_score}
          </span>
        ) : (
          <Muted>待赛</Muted>
        )}
      </DataCell>
      <DataCell label="奖金">
        {!allSettled ? <Muted>—</Muted> : `${money(totalPayout)} 元`}
      </DataCell>
      <DataCell label="净收益">
        {!allSettled ? (
          <Muted>—</Muted>
        ) : (
          <span
            className={
              totalProfit > 0
                ? 'text-[var(--green)]'
                : totalProfit < 0
                  ? 'text-[var(--red)]'
                  : ''
            }
          >
            {signedMoney(totalProfit)} 元
          </span>
        )}
      </DataCell>
      <div className="flex justify-end">
        {canEdit && (
          <button
            className="edit-icon-button"
            onClick={onEdit}
            aria-label={`编辑 ${match.home_team} 对 ${match.away_team}`}
            title="编辑"
          >
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
            </svg>
          </button>
        )}
      </div>
    </article>
  )
}

function OddsLine({
  label,
  h,
  d,
  a,
}: {
  label: string
  h?: number | null
  d?: number | null
  a?: number | null
}) {
  if (h == null && d == null && a == null) return <Muted>—</Muted>
  return (
    <div className="odds-line">
      <small>{label}</small>
      <span>主 {h ?? '—'}</span>
      <span>平 {d ?? '—'}</span>
      <span>客 {a ?? '—'}</span>
    </div>
  )
}

function MoodFace({ value, size = 'normal' }: { value: number; size?: 'normal' | 'large' }) {
  const mouth = value > 0 ? 'M6 9c2 3 6 3 8 0' : value < 0 ? 'M6 12c2-3 6-3 8 0' : 'M6 10.5h8'
  return (
    <span
      className={`mood-face ${value > 0 ? 'is-happy' : value < 0 ? 'is-sad' : ''} ${size === 'large' ? 'is-large' : ''}`}
      aria-label={value > 0 ? '盈利' : value < 0 ? '亏损' : '持平或待定'}
      title={value > 0 ? '盈利' : value < 0 ? '亏损' : '持平或待定'}
    >
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="8" />
        <circle cx="7" cy="8" r=".7" fill="currentColor" stroke="none" />
        <circle cx="13" cy="8" r=".7" fill="currentColor" stroke="none" />
        <path d={mouth} />
      </svg>
    </span>
  )
}

function TicketDetails({
  ticket,
  matches,
}: {
  ticket: TicketRecord
  matches: Match[]
}) {
  const byNumber = new Map(
    matches.map((match) => [match.source_match_number, match]),
  )
  return (
    <div className="ticket-details" role="tooltip">
      {ticket.legs.map((leg) => {
        const match = byNumber.get(leg.sourceMatchNumber)
        return (
          <div key={leg.sourceMatchNumber} className="ticket-detail-row">
            <span>
              {match ? `${match.home_team} vs ${match.away_team}` : `M${leg.sourceMatchNumber}`}
            </span>
            <span>
              {leg.market === 'score' ? (
                <>比分 {leg.scoreHome}:{leg.scoreAway} @{leg.odds}</>
              ) : (
                <>
                  {leg.market === 'handicap' ? `让${formatHandicap(leg.handicap)} ` : ''}
                  {outcomeLabel(leg.direction!)} @{leg.odds}
                </>
              )}
            </span>
          </div>
        )
      })}
      <div className="ticket-detail-total">
        金额 {money(ticket.stake)} 元
      </div>
    </div>
  )
}

function DataCell({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <span className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-[var(--muted)] lg:hidden">
        {label}
      </span>
      <div className="text-sm text-[var(--secondary)]">{children}</div>
    </div>
  )
}

function OutcomeTag({ outcome }: { outcome: Outcome }) {
  return (
    <span className={`outcome outcome-${outcome.toLowerCase()}`}>
      {outcome === 'H' ? '主胜' : outcome === 'A' ? '客胜' : '平'}
    </span>
  )
}

function Muted({ children }: { children: React.ReactNode }) {
  return <span className="text-[var(--muted)]">{children}</span>
}

function EditDrawer({
  match,
  bets,
  onClose,
  onSaved,
}: {
  match: Match
  bets: Bet[]
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [selectedBetId, setSelectedBetId] = useState<string | null>(
    bets[0]?.id || null,
  )
  const selectedBet = bets.find((bet) => bet.id === selectedBetId)
  const [homeScore, setHomeScore] = useState(
    match.home_score == null ? '' : String(match.home_score),
  )
  const [awayScore, setAwayScore] = useState(
    match.away_score == null ? '' : String(match.away_score),
  )
  const [direction, setDirection] = useState<Outcome>(selectedBet?.direction || 'H')
  const [market, setMarket] = useState<'win_draw_loss' | 'handicap'>(
    selectedBet?.market || 'win_draw_loss',
  )
  const [handicap, setHandicap] = useState(
    String(selectedBet?.handicap || 0),
  )
  const [odds, setOdds] = useState(selectedBet ? String(selectedBet.odds) : '')
  const [stake, setStake] = useState(
    selectedBet ? String(selectedBet.stake) : '100',
  )
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const request = async (url: string, options: RequestInit) => {
    const token = sessionStorage.getItem('twodogs_session_token')
    if (!token) throw new Error('请重新登录')
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-session-token': token,
        ...options.headers,
      },
    })
    const body = await response.json()
    if (!response.ok) throw new Error(body.error || '保存失败')
    return body
  }

  const saveResult = async () => {
    setSaving(true)
    setMessage('')
    try {
      const bothEmpty = homeScore === '' && awayScore === ''
      await request(`/api/matches/${match.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          homeScore: bothEmpty ? null : Number(homeScore),
          awayScore: bothEmpty ? null : Number(awayScore),
        }),
      })
      setMessage('赛果已保存')
      await onSaved()
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const saveBet = async () => {
    setSaving(true)
    setMessage('')
    try {
      await request('/api/bets', {
        method: 'POST',
        body: JSON.stringify({
          id: selectedBet?.id,
          matchId: match.id,
          direction,
          market,
          handicap: Number(handicap),
          odds: Number(odds),
          stake: Number(stake),
        }),
      })
      setMessage('投注已保存')
      await onSaved()
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const deleteBet = async () => {
    if (!selectedBet) return
    setSaving(true)
    setMessage('')
    try {
      await request(`/api/bets?id=${selectedBet.id}`, { method: 'DELETE' })
      await onSaved()
    } catch (deleteError) {
      setMessage(deleteError instanceof Error ? deleteError.message : '删除失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside className="edit-drawer" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="section-label mb-2">录入 / 修改</p>
            <h2 className="font-display text-3xl text-[var(--text)]">
              {match.home_team} vs {match.away_team}
            </h2>
          </div>
          <button className="text-button" onClick={onClose}>
            关闭
          </button>
        </div>

        <section className="drawer-section">
          <h3 className="mb-4 font-medium">赛果</h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="field">
              <span>{match.home_team}</span>
              <input
                className="input"
                type="number"
                min="0"
                value={homeScore}
                onChange={(event) => setHomeScore(event.target.value)}
              />
            </label>
            <label className="field">
              <span>{match.away_team}</span>
              <input
                className="input"
                type="number"
                min="0"
                value={awayScore}
                onChange={(event) => setAwayScore(event.target.value)}
              />
            </label>
          </div>
          <button className="secondary-button mt-4" disabled={saving} onClick={saveResult}>
            保存赛果
          </button>
        </section>

        <section className="drawer-section">
          <h3 className="mb-4 font-medium">共同投注</h3>
          {bets.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-2">
              {bets.map((bet, index) => (
                <button
                  key={bet.id}
                  className={`bet-chip ${selectedBetId === bet.id ? 'is-active' : ''}`}
                  onClick={() => {
                    setSelectedBetId(bet.id)
                    setDirection(bet.direction)
                    setMarket(bet.market || 'win_draw_loss')
                    setHandicap(String(bet.handicap || 0))
                    setOdds(String(bet.odds))
                    setStake(String(bet.stake))
                  }}
                >
                  第 {index + 1} 注 · @{bet.odds}
                </button>
              ))}
              <button
                className={`bet-chip ${selectedBetId === null ? 'is-active' : ''}`}
                onClick={() => {
                  setSelectedBetId(null)
                  setDirection('H')
                  setMarket('win_draw_loss')
                  setHandicap('0')
                  setOdds('')
                  setStake('100')
                }}
              >
                + 新增一注
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="field">
              <span>玩法</span>
              <select
                className="input"
                value={market}
                onChange={(event) =>
                  setMarket(event.target.value as 'win_draw_loss' | 'handicap')
                }
              >
                <option value="win_draw_loss">单关</option>
                <option value="handicap">让球</option>
              </select>
            </label>
            <label className="field">
              <span>让球数</span>
              <input
                className="input"
                type="number"
                step="1"
                value={handicap}
                disabled={market !== 'handicap'}
                onChange={(event) => setHandicap(event.target.value)}
              />
            </label>
            <label className="field">
              <span>方向</span>
              <select
                className="input"
                value={direction}
                onChange={(event) => setDirection(event.target.value as Outcome)}
              >
                <option value="H">主胜</option>
                <option value="D">平</option>
                <option value="A">客胜</option>
              </select>
            </label>
            <label className="field">
              <span>赔率</span>
              <input
                className="input"
                type="number"
                step="0.01"
                min="1.01"
                value={odds}
                onChange={(event) => setOdds(event.target.value)}
              />
            </label>
            <label className="field">
              <span>投注金额</span>
              <input
                className="input"
                type="number"
                step="1"
                min="1"
                value={stake}
                onChange={(event) => setStake(event.target.value)}
              />
            </label>
          </div>
          <div className="mt-4 flex gap-3">
            <button className="primary-button" disabled={saving} onClick={saveBet}>
              保存投注
            </button>
            {selectedBet && (
              <button className="danger-button" disabled={saving} onClick={deleteBet}>
                删除
              </button>
            )}
          </div>
        </section>
        {message && <p className="mt-5 text-sm text-[var(--secondary)]">{message}</p>}
      </aside>
    </div>
  )
}

function StatusScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center text-sm text-[var(--muted)]">
      <div>{children}</div>
    </div>
  )
}

function money(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 2,
  }).format(value)
}

function signedMoney(value: number) {
  return `${value > 0 ? '+' : ''}${money(value)}`
}

function outcomeLabel(outcome: Outcome) {
  return outcome === 'H' ? '主胜' : outcome === 'A' ? '客胜' : '平'
}

function betSourceLabel(bet: Bet) {
  const market =
    bet.market === 'handicap' ? `让${formatHandicap(bet.handicap)}` : '单'
  return bet.bet_source === '外围' ? `外围·${market}` : market
}

function formatHandicap(value?: number | null) {
  if (value == null || value === 0) return '0'
  return value > 0 ? `+${value}` : String(value)
}

function formatKickoff(match: Match) {
  if (!match.kickoff_at) {
    return match.match_date.slice(5).replace('-', '/')
  }
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(new Date(match.kickoff_at))
    .replace(/\//g, '/')
}
