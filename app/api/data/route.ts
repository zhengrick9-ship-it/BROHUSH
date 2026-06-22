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

type SportteryOdds = {
  sourceMatchNumber?: number | null
  homeTeam: string
  awayTeam: string
  kickoffAt?: string | null
  odds_h?: number | null
  odds_d?: number | null
  odds_a?: number | null
  handicap_value?: number | null
  odds_handicap_h?: number | null
  odds_handicap_d?: number | null
  odds_handicap_a?: number | null
  odds_score?: Record<string, number> | null
  odds_total_goals?: Record<string, number> | null
  odds_half_full?: Record<string, number> | null
  sporttery_updated_at?: string | null
}

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

  const liveOdds = await fetchSportteryOdds()
  const matches = mergeSportteryOdds(
    mergeSchedule((rawMatches || []) as Match[]),
    liveOdds,
  )
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

async function fetchSportteryOdds(): Promise<SportteryOdds[]> {
  const pools = ['hhad,had', 'crs', 'ttg', 'hafu']
  const merged = new Map<string, SportteryOdds>()

  for (const poolCode of pools) {
    try {
      const response = await fetch(
        `https://webapi.sporttery.cn/gateway/uniform/football/getMatchCalculatorV1.qry?channel=c&poolCode=${poolCode}`,
        {
          cache: 'no-store',
          headers: {
            Accept: 'application/json, text/javascript, */*; q=0.01',
            Origin: 'https://www.sporttery.cn',
            Referer: 'https://www.sporttery.cn/jc/jsq/zqspf/',
            'User-Agent': 'Mozilla/5.0',
          },
        },
      )
      if (!response.ok) continue
      const payload = (await response.json()) as SportteryPayload
      if (payload.errorCode !== '0') continue

      for (const raw of payload.value.matchInfoList.flatMap(
        (group) => group.subMatchList,
      )) {
        if (!raw.leagueAllName.includes('世界杯')) continue
        const home = normalizeSportteryTeam(raw.homeTeamAbbName)
        const away = normalizeSportteryTeam(raw.awayTeamAbbName)
        const key = `${home}__${away}`
        const current = merged.get(key) || {
          homeTeam: home,
          awayTeam: away,
        }
        merged.set(key, {
          ...current,
          sourceMatchNumber: Number(raw.matchNum) || current.sourceMatchNumber,
          kickoffAt:
            raw.matchDate && raw.matchTime
              ? `${raw.matchDate}T${raw.matchTime}+08:00`
              : current.kickoffAt,
          odds_h: numberOrNull(raw.had?.h) ?? current.odds_h,
          odds_d: numberOrNull(raw.had?.d) ?? current.odds_d,
          odds_a: numberOrNull(raw.had?.a) ?? current.odds_a,
          handicap_value:
            numberOrNull(raw.hhad?.goalLineValue) ?? current.handicap_value,
          odds_handicap_h:
            numberOrNull(raw.hhad?.h) ?? current.odds_handicap_h,
          odds_handicap_d:
            numberOrNull(raw.hhad?.d) ?? current.odds_handicap_d,
          odds_handicap_a:
            numberOrNull(raw.hhad?.a) ?? current.odds_handicap_a,
          odds_score: {
            ...(current.odds_score || {}),
            ...scoreOdds(raw.crs),
          },
          odds_total_goals: {
            ...(current.odds_total_goals || {}),
            ...totalGoalsOdds(raw.ttg),
          },
          odds_half_full: {
            ...(current.odds_half_full || {}),
            ...halfFullOdds(raw.hafu),
          },
          sporttery_updated_at: latestUpdateTime(
            current.sporttery_updated_at,
            raw.had,
            raw.hhad,
            raw.crs,
            raw.ttg,
            raw.hafu,
          ),
        })
      }
    } catch (error) {
      console.warn('Sporttery odds fetch skipped', poolCode, error)
    }
  }

  return [...merged.values()]
}

function mergeSportteryOdds(matches: Match[], odds: SportteryOdds[]): Match[] {
  const byTeams = new Map(
    odds.map((item) => [`${item.homeTeam}__${item.awayTeam}`, item]),
  )
  return matches.map((match) => {
    const live = byTeams.get(`${match.home_team}__${match.away_team}`)
    if (!live) return match
    return {
      ...match,
      kickoff_at: live.kickoffAt || match.kickoff_at,
      sporttery_match_num: live.sourceMatchNumber || match.sporttery_match_num,
      sporttery_updated_at: live.sporttery_updated_at || match.sporttery_updated_at,
      odds_h: live.odds_h ?? match.odds_h,
      odds_d: live.odds_d ?? match.odds_d,
      odds_a: live.odds_a ?? match.odds_a,
      handicap_value: live.handicap_value ?? match.handicap_value,
      odds_handicap_h: live.odds_handicap_h ?? match.odds_handicap_h,
      odds_handicap_d: live.odds_handicap_d ?? match.odds_handicap_d,
      odds_handicap_a: live.odds_handicap_a ?? match.odds_handicap_a,
      odds_score:
        live.odds_score && Object.keys(live.odds_score).length
          ? live.odds_score
          : match.odds_score,
      odds_total_goals:
        live.odds_total_goals && Object.keys(live.odds_total_goals).length
          ? live.odds_total_goals
          : match.odds_total_goals,
      odds_half_full:
        live.odds_half_full && Object.keys(live.odds_half_full).length
          ? live.odds_half_full
          : match.odds_half_full,
    }
  })
}

type SportteryPayload = {
  errorCode: string
  value: {
    matchInfoList: Array<{
      subMatchList: SportteryMatch[]
    }>
  }
}

type SportteryMarket = {
  updateDate?: string
  updateTime?: string
  [key: string]: string | number | undefined
}

type SportteryMatch = {
  leagueAllName: string
  homeTeamAbbName: string
  awayTeamAbbName: string
  matchDate: string
  matchTime: string
  matchNum?: string | number
  had?: SportteryMarket
  hhad?: SportteryMarket
  crs?: SportteryMarket
  ttg?: SportteryMarket
  hafu?: SportteryMarket
}

function normalizeSportteryTeam(name: string) {
  const aliases = new Map([
    ['刚果金', '刚果(金)'],
    ['阿尔及利', '阿尔及利亚'],
  ])
  return aliases.get(name) || name
}

function scoreOdds(market?: SportteryMarket) {
  const result: Record<string, number> = {}
  if (!market) return result
  for (let home = 0; home <= 5; home++) {
    for (let away = 0; away <= 5; away++) {
      const odds = numberOrNull(market[`s0${home}s0${away}`])
      if (odds != null) result[`${home}:${away}`] = odds
    }
  }
  addMarketValue(result, '胜其他', market.s1sh)
  addMarketValue(result, '平其他', market.s1sd)
  addMarketValue(result, '负其他', market.s1sa)
  return result
}

function totalGoalsOdds(market?: SportteryMarket) {
  const result: Record<string, number> = {}
  if (!market) return result
  for (let goals = 0; goals <= 7; goals++) {
    const odds = numberOrNull(market[`s${goals}`])
    if (odds != null) result[String(goals)] = odds
  }
  return result
}

function halfFullOdds(market?: SportteryMarket) {
  const result: Record<string, number> = {}
  if (!market) return result
  const labels: Record<string, string> = {
    hh: '胜/胜',
    hd: '胜/平',
    ha: '胜/负',
    dh: '平/胜',
    dd: '平/平',
    da: '平/负',
    ah: '负/胜',
    ad: '负/平',
    aa: '负/负',
  }
  Object.entries(labels).forEach(([key, label]) => {
    addMarketValue(result, label, market[key])
  })
  return result
}

function addMarketValue(
  target: Record<string, number>,
  key: string,
  value: string | number | undefined,
) {
  const odds = numberOrNull(value)
  if (odds != null) target[key] = odds
}

function latestUpdateTime(
  current: string | null | undefined,
  ...markets: Array<SportteryMarket | undefined>
) {
  const candidates = markets
    .map((market) =>
      market?.updateDate && market?.updateTime
        ? `${market.updateDate} ${market.updateTime}`
        : null,
    )
    .filter((value): value is string => Boolean(value))
  return [current || '', ...candidates].sort().at(-1) || null
}

function numberOrNull(value?: string | number) {
  if (value == null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}
