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
  const merged = new Map<string, SportteryOdds>(
    fallbackSportteryOdds().map((item) => [
      `${item.homeTeam}__${item.awayTeam}`,
      item,
    ]),
  )

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

function fallbackSportteryOdds(): SportteryOdds[] {
  return [
    {
      sourceMatchNumber: 3049,
      homeTeam: '瑞士',
      awayTeam: '加拿大',
      kickoffAt: '2026-06-25T03:00:00+08:00',
      odds_h: 2.25,
      odds_d: 2.65,
      odds_a: 3.25,
      handicap_value: -1,
      odds_handicap_h: 4.7,
      odds_handicap_d: 4,
      odds_handicap_a: 1.5,
      odds_score: {
        '0:0': 8,
        '1:0': 8.25,
        '1:1': 4.5,
        '2:0': 10.5,
        '2:1': 7,
        '0:1': 10,
        '1:2': 10.5,
      },
      odds_total_goals: {
        '1': 4.8,
        '2': 3.05,
        '3': 3.9,
        '4': 5.75,
      },
      odds_half_full: {
        '胜/胜': 3.85,
        '平/胜': 5,
        '负/负': 5.65,
        '平/负': 6.85,
        '平/平': 4,
      },
      sporttery_updated_at: '2026-06-24 12:45:46',
    },
    {
      sourceMatchNumber: 3050,
      homeTeam: '波黑',
      awayTeam: '卡塔尔',
      kickoffAt: '2026-06-25T03:00:00+08:00',
      odds_h: 1.28,
      odds_d: 4.91,
      odds_a: 6.9,
      handicap_value: -1,
      odds_handicap_h: 1.93,
      odds_handicap_d: 3.6,
      odds_handicap_a: 3,
      odds_score: {
        '0:0': 18,
        '1:0': 8,
        '1:1': 9,
        '2:0': 6.25,
        '2:1': 6,
        '0:1': 21,
        '1:2': 19,
      },
      odds_total_goals: {
        '1': 6.25,
        '2': 4.1,
        '3': 3.3,
        '4': 4.55,
      },
      odds_half_full: {
        '胜/胜': 1.77,
        '平/胜': 4.05,
        '负/负': 12.5,
        '平/负': 16.5,
        '平/平': 7.9,
      },
      sporttery_updated_at: '2026-06-24 12:21:56',
    },
    {
      sourceMatchNumber: 3051,
      homeTeam: '苏格兰',
      awayTeam: '巴西',
      kickoffAt: '2026-06-25T06:00:00+08:00',
      odds_h: 9,
      odds_d: 5.2,
      odds_a: 1.21,
      handicap_value: 1,
      odds_handicap_h: 3.42,
      odds_handicap_d: 3.6,
      odds_handicap_a: 1.79,
      odds_score: {
        '0:0': 14,
        '1:0': 21,
        '1:1': 8.6,
        '2:0': 50,
        '2:1': 23,
        '0:1': 6.85,
        '1:2': 7,
      },
      odds_total_goals: {
        '1': 5.3,
        '2': 3.7,
        '3': 3.4,
        '4': 5,
      },
      odds_half_full: {
        '胜/胜': 19,
        '平/胜': 21,
        '负/负': 1.67,
        '平/负': 3.65,
        '平/平': 7.5,
      },
      sporttery_updated_at: '2026-06-24 12:20:22',
    },
    {
      sourceMatchNumber: 3052,
      homeTeam: '摩洛哥',
      awayTeam: '海地',
      kickoffAt: '2026-06-25T06:00:00+08:00',
      handicap_value: -2,
      odds_handicap_h: 2.25,
      odds_handicap_d: 3.85,
      odds_handicap_a: 2.35,
      odds_score: {
        '0:0': 20,
        '1:0': 7,
        '1:1': 13.5,
        '2:0': 5.2,
        '2:1': 8,
        '0:1': 30,
        '1:2': 50,
      },
      odds_total_goals: {
        '1': 6.35,
        '2': 4.15,
        '3': 3.55,
        '4': 4.4,
      },
      odds_half_full: {
        '胜/胜': 1.36,
        '平/胜': 3.85,
        '负/负': 30,
        '平/负': 37,
        '平/平': 10.5,
      },
      sporttery_updated_at: '2026-06-24 12:49:22',
    },
    {
      sourceMatchNumber: 3053,
      homeTeam: '南非',
      awayTeam: '韩国',
      kickoffAt: '2026-06-25T09:00:00+08:00',
      odds_h: 5.45,
      odds_d: 3.7,
      odds_a: 1.48,
      handicap_value: 1,
      odds_handicap_h: 2.28,
      odds_handicap_d: 3.2,
      odds_handicap_a: 2.64,
      odds_score: {
        '0:0': 9,
        '1:0': 12.5,
        '1:1': 6.5,
        '2:0': 28,
        '2:1': 16.5,
        '0:1': 6,
        '1:2': 6.25,
      },
      odds_total_goals: {
        '1': 4.2,
        '2': 3.2,
        '3': 3.8,
        '4': 6,
      },
      odds_half_full: {
        '胜/胜': 9.05,
        '平/胜': 11.5,
        '负/负': 2.35,
        '平/负': 4,
        '平/平': 5.15,
      },
      sporttery_updated_at: '2026-06-24 12:09:54',
    },
    {
      sourceMatchNumber: 3054,
      homeTeam: '捷克',
      awayTeam: '墨西哥',
      kickoffAt: '2026-06-25T09:00:00+08:00',
      odds_h: 3.5,
      odds_d: 3.36,
      odds_a: 1.83,
      handicap_value: 1,
      odds_handicap_h: 1.74,
      odds_handicap_d: 3.55,
      odds_handicap_a: 3.66,
      odds_score: {
        '0:0': 9.5,
        '1:0': 9,
        '1:1': 6,
        '2:0': 17.5,
        '2:1': 10,
        '0:1': 6.5,
        '1:2': 6.75,
      },
      odds_total_goals: {
        '1': 4.05,
        '2': 3.25,
        '3': 3.6,
        '4': 6.25,
      },
      odds_half_full: {
        '胜/胜': 6,
        '平/胜': 8,
        '负/负': 3,
        '平/负': 4.6,
        '平/平': 5,
      },
      sporttery_updated_at: '2026-06-24 12:45:46',
    },
    {
      sourceMatchNumber: 2045,
      homeTeam: '葡萄牙',
      awayTeam: '乌兹别克',
      kickoffAt: '2026-06-24T01:00:00+08:00',
      handicap_value: -2,
      odds_handicap_h: 2.08,
      odds_handicap_d: 4.05,
      odds_handicap_a: 2.49,
      odds_score: {
        '1:0': 7.25,
        '2:0': 5.7,
        '2:1': 9,
        '3:0': 5.5,
        '3:1': 8.75,
      },
      odds_total_goals: {
        '1': 6.75,
        '2': 4.3,
        '3': 3.45,
        '4': 4.45,
      },
      odds_half_full: {
        '胜/胜': 1.33,
        '平/胜': 3.95,
      },
      sporttery_updated_at: '2026-06-23 12:17:15',
    },
    {
      sourceMatchNumber: 2046,
      homeTeam: '英格兰',
      awayTeam: '加纳',
      kickoffAt: '2026-06-24T04:00:00+08:00',
      handicap_value: -2,
      odds_handicap_h: 2.31,
      odds_handicap_d: 3.9,
      odds_handicap_a: 2.27,
      odds_score: {
        '1:0': 6.5,
        '2:0': 5.7,
        '2:1': 8.5,
        '3:0': 6,
        '3:1': 8.75,
      },
      odds_total_goals: {
        '1': 6.4,
        '2': 4.1,
        '3': 3.6,
        '4': 4.4,
      },
      odds_half_full: {
        '胜/胜': 1.4,
        '平/胜': 3.95,
      },
      sporttery_updated_at: '2026-06-23 12:26:44',
    },
    {
      sourceMatchNumber: 2047,
      homeTeam: '巴拿马',
      awayTeam: '克罗地亚',
      kickoffAt: '2026-06-24T07:00:00+08:00',
      odds_h: 6.9,
      odds_d: 4.2,
      odds_a: 1.34,
      handicap_value: 1,
      odds_handicap_h: 2.65,
      odds_handicap_d: 3.6,
      odds_handicap_a: 2.11,
      odds_score: {
        '0:1': 6.5,
        '1:2': 6,
        '0:2': 6.8,
        '1:0': 15,
        '2:1': 18,
      },
      odds_total_goals: {
        '1': 5.1,
        '2': 3.5,
        '3': 3.55,
        '4': 4.95,
      },
      odds_half_full: {
        '负/负': 1.88,
        '平/负': 4,
      },
      sporttery_updated_at: '2026-06-23 11:37:54',
    },
    {
      sourceMatchNumber: 2048,
      homeTeam: '哥伦比亚',
      awayTeam: '刚果(金)',
      kickoffAt: '2026-06-24T10:00:00+08:00',
      odds_h: 1.36,
      odds_d: 3.85,
      odds_a: 7.5,
      handicap_value: -1,
      odds_handicap_h: 2.27,
      odds_handicap_d: 3.3,
      odds_handicap_a: 2.6,
      odds_score: {
        '1:0': 5.5,
        '2:0': 6,
        '2:1': 6,
        '3:0': 9,
        '3:1': 10,
      },
      odds_total_goals: {
        '1': 4.4,
        '2': 3.15,
        '3': 3.6,
        '4': 6,
      },
      odds_half_full: {
        '胜/胜': 1.9,
        '平/胜': 3.85,
      },
      sporttery_updated_at: '2026-06-23 12:27:52',
    },
    {
      sourceMatchNumber: 1041,
      homeTeam: '阿根廷',
      awayTeam: '奥地利',
      kickoffAt: '2026-06-23T01:00:00+08:00',
      odds_h: 1.32,
      odds_d: 4.17,
      odds_a: 7.6,
      handicap_value: -1,
      odds_handicap_h: 2.06,
      odds_handicap_d: 3.44,
      odds_handicap_a: 2.83,
      odds_score: {
        '1:0': 6.25,
        '2:0': 6,
        '2:1': 6.5,
        '3:0': 10,
      },
      odds_total_goals: {
        '1': 4.9,
        '2': 3.55,
        '3': 3.5,
      },
      odds_half_full: {
        '胜/胜': 1.92,
        '平/胜': 3.8,
        '平/平': 6.55,
      },
      sporttery_updated_at: '2026-06-22 13:51:59',
    },
    {
      sourceMatchNumber: 1042,
      homeTeam: '法国',
      awayTeam: '伊拉克',
      kickoffAt: '2026-06-23T05:00:00+08:00',
      handicap_value: -3,
      odds_handicap_h: 2.33,
      odds_handicap_d: 4.25,
      odds_handicap_a: 2.15,
      odds_score: {
        '2:0': 6.4,
        '3:0': 5.1,
        '4:0': 6,
      },
      odds_total_goals: {
        '2': 5.8,
        '3': 3.7,
        '4': 3.75,
      },
      odds_half_full: {
        '胜/胜': 1.34,
        '平/胜': 4.25,
      },
      sporttery_updated_at: '2026-06-22 14:28:36',
    },
    {
      sourceMatchNumber: 1043,
      homeTeam: '挪威',
      awayTeam: '塞内加尔',
      kickoffAt: '2026-06-23T08:00:00+08:00',
      odds_h: 1.88,
      odds_d: 3.44,
      odds_a: 3.26,
      handicap_value: -1,
      odds_handicap_h: 3.66,
      odds_handicap_d: 3.78,
      odds_handicap_a: 1.69,
      odds_total_goals: {
        '2': 3.55,
        '3': 3.6,
      },
      odds_half_full: {
        '胜/胜': 3.15,
        '平/胜': 5,
        '平/平': 5.2,
      },
      sporttery_updated_at: '2026-06-22 15:12:50',
    },
    {
      sourceMatchNumber: 1044,
      homeTeam: '约旦',
      awayTeam: '阿尔及利亚',
      kickoffAt: '2026-06-23T11:00:00+08:00',
      odds_h: 6.1,
      odds_d: 4,
      odds_a: 1.4,
      handicap_value: 1,
      odds_handicap_h: 2.51,
      odds_handicap_d: 3.35,
      odds_handicap_a: 2.31,
      odds_total_goals: {
        '2': 3.4,
        '3': 3.55,
      },
      odds_half_full: {
        '负/负': 2.05,
        '平/负': 3.85,
      },
      sporttery_updated_at: '2026-06-22 14:45:54',
    },
  ]
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
