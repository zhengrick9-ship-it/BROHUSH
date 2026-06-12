import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getEditorSession } from '@/lib/auth/session'
import { WORLD_CUP_FIXTURES } from '@/lib/wcw2026/fixtures'
import { settleBet } from '@/lib/wcw2026/metrics'
import type { Bet, Match } from '@/lib/wcw2026/types'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return NextResponse.json({ error: '数据库读取配置缺失' }, { status: 500 })
  }

  const supabase = createClient(url, anonKey)
  const [{ data: rawMatches, error: matchesError }, { data: rawBets, error: betsError }, session] =
    await Promise.all([
      supabase.from('matches').select('*').order('match_date').order('id'),
      supabase.from('bets').select('*').order('created_at'),
      getEditorSession(),
    ])

  if (matchesError || betsError) {
    console.error('Failed to load WCW2026 data', { matchesError, betsError })
    return NextResponse.json({ error: '世界杯数据读取失败' }, { status: 502 })
  }

  const matches = mergeSchedule((rawMatches || []) as Match[])
  const matchMap = new Map(matches.map((match) => [match.id, match]))
  const bets = ((rawBets || []) as Bet[]).map((bet) =>
    settleBet(bet, matchMap.get(bet.match_id)),
  )

  return NextResponse.json({
    matches,
    bets,
    canEdit: Boolean(session),
    editorName: session?.name || null,
  })
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
        stage: stored.stage || fixture.stage,
        round_number: stored.round_number || fixture.roundNumber,
        group_name: stored.group_name || fixture.groupName,
      }
    }

    return {
      id: `schedule-${fixture.sourceMatchNumber}`,
      source_match_number: fixture.sourceMatchNumber,
      match_date: fixture.matchDate,
      kickoff_at: null,
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
