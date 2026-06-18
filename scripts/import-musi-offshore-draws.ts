import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'

import { settleBet } from '../lib/wcw2026/metrics.ts'
import type { Bet, Match } from '../lib/wcw2026/types.ts'

loadLocalEnv()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
}

const db = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const OWNER = '木四'
const STAKE = 1000
const PURCHASED_AT = '2026-06-11T18:00:00+08:00'

const finishedResults = [
  result(1, 1, 2),
  result(2, 2, 0),
  result(3, 1, 1),
  result(4, 1, 0),
  result(5, 0, 1),
  result(6, 1, 1),
  result(7, 2, 0),
  result(8, 1, 1),
  result(9, 1, 0),
  result(10, 7, 1),
  result(11, 2, 2),
  result(12, 5, 1),
  result(13, 1, 1),
  result(14, 0, 0),
  result(15, 2, 2),
  result(16, 1, 1),
  result(17, 3, 1),
  result(18, 1, 4),
  result(19, 3, 0),
  result(20, 3, 1),
  result(21, 1, 0),
  result(22, 4, 2),
  result(23, 1, 1),
  result(24, 1, 3),
]

const offshoreDrawOdds = [
  draw(1, 4.5, 'FOX/FanDuel +350'),
  draw(2, 3.1, 'FOX/FanDuel +210'),
  draw(3, 3.5, 'FOX/FanDuel +250'),
  draw(4, 3.4, 'FOX/FanDuel +240'),
  draw(5, 5.1, 'FOX/FanDuel +410'),
  draw(6, 3.5, 'FOX/FanDuel +250'),
  draw(7, 3.7, '公开外围盘 +270'),
  draw(8, 7, 'SportsGambler 7.00'),
  draw(9, 2.9, 'FOX/FanDuel +190'),
  draw(10, 20, 'FOX/FanDuel +1900'),
  draw(11, 3.5, 'FOX/FanDuel +250'),
  draw(12, 3.4, 'FOX/FanDuel +240'),
  draw(13, 4.3, 'FOX/FanDuel +330'),
  draw(14, 14, 'FOX/FanDuel +1300'),
  draw(15, 3.3, 'FOX/FanDuel +230'),
  draw(16, 3.9, 'FOX/FanDuel +290'),
  draw(17, 4.7, 'Oddschecker +370'),
  draw(18, 6.5, 'Oddschecker +550'),
  draw(19, 4.75, 'Oddschecker +375'),
  draw(20, 6, '公开外围盘 +500'),
  draw(21, 3.6, 'Oddschecker +260'),
  draw(22, 3.85, 'Oddschecker +285'),
  draw(23, 6, '公开外围盘 +500'),
  draw(24, 4.54, 'Oddschecker/Pinnacle 4.54'),
]

for (const item of finishedResults) {
  const { error } = await db
    .from('matches')
    .update({
      home_score: item.homeScore,
      away_score: item.awayScore,
      actual_result:
        item.homeScore > item.awayScore
          ? 'H'
          : item.homeScore < item.awayScore
            ? 'A'
            : 'D',
      match_status: 'finished',
    })
    .eq('source_match_number', item.sourceMatchNumber)
  if (error) throw error
}

const { data: matches, error: matchError } = await db
  .from('matches')
  .select('*')
  .in(
    'source_match_number',
    offshoreDrawOdds.map((item) => item.sourceMatchNumber),
  )
if (matchError) throw matchError

const matchByNumber = new Map(
  ((matches || []) as Match[]).map((match) => [match.source_match_number, match]),
)

for (const item of offshoreDrawOdds) {
  if (!matchByNumber.has(item.sourceMatchNumber)) {
    throw new Error(`Missing match ${item.sourceMatchNumber}`)
  }
}

const { error: clearError } = await db
  .from('bets')
  .delete()
  .eq('owner_name', OWNER)
  .eq('bet_source', '外围')
  .eq('market', 'win_draw_loss')
  .eq('direction', 'D')
  .in(
    'match_id',
    offshoreDrawOdds.map((item) => matchByNumber.get(item.sourceMatchNumber)!.id),
  )
if (clearError) throw clearError

const rows = offshoreDrawOdds.map((item) => {
  const match = matchByNumber.get(item.sourceMatchNumber)!
  const baseBet: Bet = {
    id: '',
    match_id: match.id,
    owner_name: OWNER,
    bet_source: '外围',
    market: 'win_draw_loss',
    handicap: 0,
    direction: 'D',
    odds: item.odds,
    stake: STAKE,
    result: 'pending',
    profit: 0,
    created_at: PURCHASED_AT,
  }
  const settled = settleBet(baseBet, match)
  return {
    match_id: settled.match_id,
    owner_name: OWNER,
    bet_source: '外围',
    market: 'win_draw_loss',
    handicap: 0,
    direction: 'D',
    odds: settled.odds,
    stake: settled.stake,
    result: settled.result,
    profit: settled.profit,
    created_at: PURCHASED_AT,
  }
})

const { error: insertError } = await db.from('bets').insert(rows)
if (insertError) throw insertError

const settledRows = rows.filter((row) => row.result !== 'pending')
const stake = rows.reduce((sum, row) => sum + row.stake, 0)
const settledStake = settledRows.reduce((sum, row) => sum + row.stake, 0)
const payout = settledRows.reduce(
  (sum, row) => sum + (row.result === 'won' ? row.stake + row.profit : 0),
  0,
)
const profit = settledRows.reduce((sum, row) => sum + row.profit, 0)

console.table(
  offshoreDrawOdds.map((item) => ({
    match: item.sourceMatchNumber,
    odds: item.odds,
    source: item.source,
  })),
)
console.log({
  owner: OWNER,
  count: rows.length,
  stake,
  settledStake,
  payout,
  profit,
})

function draw(sourceMatchNumber: number, odds: number, source: string) {
  return { sourceMatchNumber, odds, source }
}

function result(
  sourceMatchNumber: number,
  homeScore: number,
  awayScore: number,
) {
  return { sourceMatchNumber, homeScore, awayScore }
}

function loadLocalEnv() {
  if (!existsSync('.env.local')) return
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const equalsIndex = trimmed.indexOf('=')
    if (equalsIndex < 1) continue
    const key = trimmed.slice(0, equalsIndex)
    const value = trimmed.slice(equalsIndex + 1).replace(/^['"]|['"]$/g, '')
    process.env[key] ||= value
  }
}
