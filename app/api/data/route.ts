import { NextResponse } from 'next/server'
import {
  getEditorSession,
  isPrivilegedName,
  ownerNamesForSession,
} from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { WORLD_CUP_FIXTURES } from '@/lib/wcw2026/fixtures'
import { settleBet } from '@/lib/wcw2026/metrics'
import type { Bet, Match, TicketRecord } from '@/lib/wcw2026/types'

export async function GET(request: Request) {
  const session = await getEditorSession(request)
  if (!session) {
    return NextResponse.json({ error: '请重新登录' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const canViewRecords = isPrivilegedName(session.name)
  const { data: rawMatches, error: matchesError } = await supabase
    .from('matches')
    .select('*')
    .order('match_date')
    .order('id')

  if (matchesError) {
    console.error('Failed to load WCW2026 data', {
      matchesError,
    })
    return NextResponse.json({ error: '世界杯数据读取失败' }, { status: 502 })
  }

  const matches = mergeSchedule((rawMatches || []) as Match[])
  if (!canViewRecords) {
    return NextResponse.json({
      matches,
      bets: [],
      tickets: [],
      canEdit: false,
      canViewRecords: false,
      editorName: session.name,
    })
  }

  const ownerNames = ownerNamesForSession(session.name)
  const [
    { data: rawBets, error: betsError },
    { data: rawTickets, error: ticketsError },
  ] = await Promise.all([
    supabase
      .from('bets')
      .select('*')
      .in('owner_name', ownerNames)
      .order('created_at'),
    supabase
      .from('bet_tickets')
      .select('*, bet_legs(*)')
      .in('owner_name', ownerNames)
      .order('ticket_number'),
  ])

  if (betsError || ticketsError) {
    console.error('Failed to load WCW2026 private data', {
      betsError,
      ticketsError,
    })
    return NextResponse.json({ error: '世界杯数据读取失败' }, { status: 502 })
  }

  const matchMap = new Map(matches.map((match) => [match.id, match]))
  const bets = ((rawBets || []) as Bet[]).map((bet) =>
    settleBet(bet, matchMap.get(bet.match_id)),
  )

  return NextResponse.json({
    matches,
    bets,
    tickets: (rawTickets || []).map(mapTicket),
    canEdit: true,
    canViewRecords: true,
    editorName: session.name,
  })
}

function mapTicket(row: Record<string, unknown>): TicketRecord {
  const legs = (row.bet_legs || []) as Array<Record<string, unknown>>
  return {
    id: String(row.id),
    ownerName: String(row.owner_name),
    ticketNumber: Number(row.ticket_number),
    label: String(row.label),
    stake: Number(row.stake),
    baseStake: Number(row.base_stake),
    multiplier: Number(row.multiplier),
    passTypes: (row.pass_types || []) as number[],
    purchasedAt: String(row.purchased_at),
    result: String(row.result) as TicketRecord['result'],
    profit: Number(row.profit),
    sourceImage: String(row.source_image || ''),
    needsReview: Boolean(row.needs_review),
    potentialPayout:
      row.potential_payout == null ? undefined : Number(row.potential_payout),
    legs: legs.map((leg) => ({
      sourceMatchNumber: Number(leg.source_match_number),
      market: String(leg.market) as TicketRecord['legs'][number]['market'],
      handicap: Number(leg.handicap),
      direction:
        leg.direction == null ? null : (String(leg.direction) as 'H' | 'D' | 'A'),
      odds: Number(leg.odds),
      scoreHome: leg.score_home == null ? null : Number(leg.score_home),
      scoreAway: leg.score_away == null ? null : Number(leg.score_away),
    })),
  }
}

function mergeSchedule(databaseMatches: Match[]): Match[] {
  const byNumber = new Map(
    databaseMatches
      .filter((match) => match.source_match_number)
      .map((match) => [match.source_match_number, match]),
  )
  const byTeams = new Map(
    databaseMatches.map((match) => [
      `${match.home_team}__${match.away_team}`,
      match,
    ]),
  )

  return WORLD_CUP_FIXTURES.map((fixture) => {
    const stored =
      byNumber.get(fixture.sourceMatchNumber) ||
      byTeams.get(`${fixture.homeTeam}__${fixture.awayTeam}`)

    if (stored) {
      return {
        ...stored,
        source_match_number: fixture.sourceMatchNumber,
        kickoff_at: stored.kickoff_at || fixture.kickoffAt,
        stage: stored.stage || fixture.stage,
        round_number: stored.round_number || fixture.roundNumber,
        group_name: stored.group_name || fixture.groupName,
      }
    }

    return {
      id: `schedule-${fixture.sourceMatchNumber}`,
      source_match_number: fixture.sourceMatchNumber,
      match_date: fixture.matchDate,
      kickoff_at: fixture.kickoffAt,
      group_name: fixture.groupName,
      stage: fixture.stage,
      round_number: fixture.roundNumber,
      home_team: fixture.homeTeam,
      away_team: fixture.awayTeam,
      odds_h: null,
      odds_d: null,
      odds_a: null,
      prediction: null,
      model_prob_h: null,
      model_prob_d: null,
      model_prob_a: null,
      edge_pct: null,
      strategy_tag: null,
      actual_result: null,
      home_score: null,
      away_score: null,
      match_status: 'scheduled',
    } satisfies Match
  })
}
