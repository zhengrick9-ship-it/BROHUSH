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
  if (
    !match ||
    match.match_status !== 'finished' ||
    match.home_score == null ||
    match.away_score == null
  ) {
    return { ...bet, result: 'pending', profit: 0 }
  }

  const adjustedHome =
    match.home_score + (bet.market === 'handicap' ? bet.handicap || 0 : 0)
  const actual =
    adjustedHome > match.away_score
      ? 'H'
      : adjustedHome < match.away_score
        ? 'A'
        : 'D'
  const won = actual === bet.direction
  return {
    ...bet,
    result: won ? 'won' : 'lost',
    profit: won ? roundMoney(bet.stake * (bet.odds - 1)) : -bet.stake,
  }
}

export function betPayout(bet: Bet) {
  return bet.result === 'won' ? roundMoney(bet.stake + bet.profit) : 0
}

export function settleTicket(
  ticket: TicketRecord,
  matches: Match[],
): TicketRecord {
  if (ticket.legs.length === 0) {
    return {
      ...ticket,
      settledStake: ticket.result === 'pending' ? 0 : ticket.stake,
      payout: ticket.result === 'won' ? ticket.potentialPayout || 0 : 0,
      minPayout: ticket.result === 'won' ? ticket.potentialPayout || 0 : 0,
      maxPayout:
        ticket.result === 'pending'
          ? ticket.potentialPayout || 0
          : ticket.payout || 0,
      minProfit: ticket.result === 'pending' ? -ticket.stake : ticket.profit,
      maxProfit:
        ticket.result === 'pending'
          ? roundMoney((ticket.potentialPayout || 0) - ticket.stake)
          : ticket.profit,
    }
  }
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
  const legGroups = [
    ...Map.groupBy(legs, (leg) => leg.sourceMatchNumber).values(),
  ]
  const allCombinations = ticket.passTypes.flatMap((passSize) =>
    combinations(legGroups, passSize).flatMap(cartesianProduct),
  )
  const unitStake = ticket.baseStake * ticket.multiplier
  const settledCombinations = allCombinations.filter(
    (combination) =>
      combination.some((leg) => leg.status === 'lost') ||
      combination.every((leg) => leg.status === 'won'),
  )
  const winningCombinations = settledCombinations.filter((combination) =>
    combination.every((leg) => leg.status === 'won'),
  )
  const settledStake = roundMoney(settledCombinations.length * unitStake)
  const payout = combinationPayout(
    winningCombinations,
    ticket.baseStake,
    ticket.multiplier,
  )
  const finalPayouts = cartesianProduct(
    legGroups.map(possibleWinningSets),
  ).map((scenarioGroups) => {
    const winners = new Set(scenarioGroups.flat())
    return combinationPayout(
      allCombinations.filter((combination) =>
        combination.every((leg) => winners.has(leg)),
      ),
      ticket.baseStake,
      ticket.multiplier,
    )
  })
  const minPayout = Math.min(...finalPayouts)
  const maxPayout = Math.max(...finalPayouts)
  const hasPending = settledCombinations.length < allCombinations.length
  const result: TicketRecord['result'] = hasPending
    ? 'pending'
    : payout > 0
      ? 'won'
      : 'lost'

  return {
    ...ticket,
    result,
    payout,
    settledStake,
    minPayout,
    maxPayout,
    minProfit: roundMoney(minPayout - ticket.stake),
    maxProfit: roundMoney(maxPayout - ticket.stake),
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
  const settledStake = participantCount * (
    sum(settled.map((bet) => bet.stake)) +
    sum(tickets.map((ticket) => ticket.settledStake || 0))
  )
  const settledPayout = roundMoney(
    participantCount *
      (sum(settled.map(betPayout)) +
        sum(tickets.map((ticket) => ticket.payout || 0))),
  )
  const settledProfit = roundMoney(settledPayout - settledStake)

  return {
    totalStake: roundMoney(
      participantCount *
        (sum(bets.map((bet) => bet.stake)) +
          sum(tickets.map((ticket) => ticket.stake))),
    ),
    settledStake: roundMoney(settledStake),
    settledPayout,
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

function combinationPayout(
  combinationsToPay: Array<Array<{ odds: number }>>,
  baseStake: number,
  multiplier: number,
) {
  return roundMoney(
    multiplier *
      combinationsToPay.reduce(
        (total, combination) =>
          total +
          roundMoney(
            baseStake *
              combination.reduce((product, leg) => product * leg.odds, 1),
          ),
        0,
      ),
  )
}

function cartesianProduct<T>(groups: T[][]): T[][] {
  return groups.reduce<T[][]>(
    (products, group) =>
      products.flatMap((product) => group.map((item) => [...product, item])),
    [[]],
  )
}

function possibleWinningSets<T extends {
  status: 'won' | 'lost' | 'pending'
  market: 'win_draw_loss' | 'handicap'
  handicap: number
  direction: 'H' | 'D' | 'A'
}>(legs: T[]): T[][] {
  if (legs.every((leg) => leg.status !== 'pending')) {
    return [legs.filter((leg) => leg.status === 'won')]
  }

  const sets = new Map<string, T[]>()
  for (let margin = -20; margin <= 20; margin++) {
    const winners = legs.filter((leg) => {
      if (leg.status === 'lost') return false
      if (leg.status === 'won') return true
      const adjustedMargin =
        margin + (leg.market === 'handicap' ? leg.handicap : 0)
      const outcome =
        adjustedMargin > 0 ? 'H' : adjustedMargin < 0 ? 'A' : 'D'
      return outcome === leg.direction
    })
    const key = winners
      .map((leg) => legs.indexOf(leg))
      .sort((a, b) => a - b)
      .join(',')
    sets.set(key, winners)
  }
  return [...sets.values()]
}
