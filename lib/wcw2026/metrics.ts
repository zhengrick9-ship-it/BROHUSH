import type { Bet, Match, Summary, TicketRecord, TimelinePoint } from './types.ts'

const roundLabels: Record<string, { label: string; order: number }> = {
  round_of_32: { label: '32 强', order: 40 },
  round_of_16: { label: '16 强', order: 50 },
  quarterfinal: { label: '8 强', order: 60 },
  semifinal: { label: '半决赛', order: 70 },
  third_place: { label: '季军赛', order: 80 },
  final: { label: '决赛', order: 90 },
}

export function settleBet(bet: Bet, match?: Match): Bet {
  if (!match || match.match_status !== 'finished' || !match.actual_result) {
    return { ...bet, result: 'pending', profit: 0 }
  }

  const won = match.actual_result === bet.direction
  return {
    ...bet,
    result: won ? 'won' : 'lost',
    profit: won ? roundMoney(bet.stake * (bet.odds - 1)) : -bet.stake,
  }
}

export function settleTicket(
  ticket: TicketRecord,
  matches: Match[],
): TicketRecord {
  const matchMap = new Map(
    matches
      .filter((match) => match.source_match_number)
      .map((match) => [match.source_match_number, match]),
  )
  const legs = ticket.legs.map((leg) => {
    const match = matchMap.get(leg.sourceMatchNumber)
    if (
      !match ||
      match.match_status !== 'finished' ||
      match.home_score == null ||
      match.away_score == null
    ) {
      return { ...leg, status: 'pending' as const }
    }

    const homeScore =
      match.home_score + (leg.market === 'handicap' ? leg.handicap : 0)
    const outcome: 'H' | 'D' | 'A' =
      homeScore > match.away_score ? 'H' : homeScore < match.away_score ? 'A' : 'D'
    return {
      ...leg,
      status: outcome === leg.direction ? ('won' as const) : ('lost' as const),
    }
  })

  const minimumPass = Math.min(...ticket.passTypes)
  const possibleLegs = legs.filter((leg) => leg.status !== 'lost').length
  const settledAt = ticket.legs
    .map((leg) => matchMap.get(leg.sourceMatchNumber))
    .filter(
      (match): match is Match =>
        Boolean(match && match.match_status === 'finished'),
    )
    .map((match) => match.kickoff_at || match.match_date)
    .sort()
    .at(-1)
    ?.slice(0, 10)
  if (possibleLegs < minimumPass) {
    return { ...ticket, result: 'lost', profit: -ticket.stake, settledAt }
  }
  if (legs.some((leg) => leg.status === 'pending')) {
    return { ...ticket, result: 'pending', profit: 0 }
  }

  const winningLegs = legs.filter((leg) => leg.status === 'won')
  const payout = ticket.passTypes.reduce((total, passSize) => {
    if (winningLegs.length < passSize) return total
    return (
      total +
      combinations(winningLegs, passSize).reduce(
        (passTotal, combination) =>
          passTotal +
          ticket.baseStake *
            ticket.multiplier *
            combination.reduce((product, leg) => product * leg.odds, 1),
        0,
      )
    )
  }, 0)

  return {
    ...ticket,
    result: payout > 0 ? 'won' : 'lost',
    profit: roundMoney(payout - ticket.stake),
    settledAt,
  }
}

export function summarizeBets(
  bets: Bet[],
  tickets: TicketRecord[] = [],
  participantCount = 1,
): Summary {
  const settled = bets.filter((bet) => bet.result !== 'pending')
  const settledTickets = tickets.filter((ticket) => ticket.result !== 'pending')
  const settledStake = participantCount * (
    sum(settled.map((bet) => bet.stake)) +
    sum(settledTickets.map((ticket) => ticket.stake))
  )
  const settledProfit = roundMoney(
    participantCount *
      (sum(settled.map((bet) => bet.profit)) +
        sum(settledTickets.map((ticket) => ticket.profit))),
  )

  return {
    totalStake: roundMoney(
      participantCount *
        (sum(bets.map((bet) => bet.stake)) +
          sum(tickets.map((ticket) => ticket.stake))),
    ),
    settledStake: roundMoney(settledStake),
    settledProfit,
    roi: settledStake > 0 ? roundMoney((settledProfit / settledStake) * 100) : 0,
    won: settled.filter((bet) => bet.result === 'won').length,
    lost: settled.filter((bet) => bet.result === 'lost').length,
    pending: bets.filter((bet) => bet.result === 'pending').length,
  }
}

export function getRoundKey(match: Match) {
  if (match.stage === 'group') {
    const round = match.round_number || 1
    return {
      id: `group-${round}`,
      label: `小组赛 第 ${round} 轮`,
      order: round,
    }
  }

  const stage = match.stage || 'group'
  const known = roundLabels[stage]
  return {
    id: stage,
    label: known?.label || stage,
    order: known?.order || 99,
  }
}

export function buildTimeline(
  bets: Bet[],
  matches: Match[],
  tickets: TicketRecord[] = [],
  participantCount = 1,
): TimelinePoint[] {
  const matchMap = new Map(matches.map((match) => [match.id, match]))
  const events = new Map<string, { stake: number; profit: number }>()

  for (const bet of bets) {
    const placedDate = toDate(bet.created_at)
    addEvent(events, placedDate, bet.stake * participantCount, 0)

    if (bet.result !== 'pending') {
      const match = matchMap.get(bet.match_id)
      if (match) {
        addEvent(
          events,
          toDate(match.kickoff_at || match.match_date),
          0,
          bet.profit * participantCount,
        )
      }
    }
  }

  for (const ticket of tickets) {
    addEvent(
      events,
      toDate(ticket.purchasedAt),
      ticket.stake * participantCount,
      0,
    )
    if (ticket.result !== 'pending' && ticket.settledAt) {
      addEvent(
        events,
        toDate(ticket.settledAt),
        0,
        ticket.profit * participantCount,
      )
    }
  }

  let stake = 0
  let profit = 0
  return [...events.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, event]) => {
      stake = roundMoney(stake + event.stake)
      profit = roundMoney(profit + event.profit)
      return { date, stake, profit }
    })
}

function addEvent(
  events: Map<string, { stake: number; profit: number }>,
  date: string,
  stake: number,
  profit: number,
) {
  const current = events.get(date) || { stake: 0, profit: 0 }
  events.set(date, {
    stake: current.stake + stake,
    profit: current.profit + profit,
  })
}

function toDate(value: string) {
  return value.slice(0, 10)
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + Number(value || 0), 0)
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]]
  if (items.length < size) return []
  const [first, ...rest] = items
  return [
    ...combinations(rest, size - 1).map((combination) => [first, ...combination]),
    ...combinations(rest, size),
  ]
}
