import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
}

const response = await fetch(
  'https://webapi.sporttery.cn/gateway/uniform/football/getMatchCalculatorV1.qry?channel=c&poolCode=hhad,had',
  {
    headers: {
      Accept: 'application/json, text/javascript, */*; q=0.01',
      Origin: 'https://www.sporttery.cn',
      Referer: 'https://www.sporttery.cn/jc/jsq/zqspf/',
      'User-Agent': 'Mozilla/5.0',
    },
  },
)
if (!response.ok) throw new Error(`Sporttery HTTP ${response.status}`)

const payload = (await response.json()) as {
  errorCode: string
  value: {
    matchInfoList: Array<{
      subMatchList: SportteryMatch[]
    }>
  }
}
if (payload.errorCode !== '0') throw new Error('Sporttery API returned an error')

const db = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const { data: databaseMatches, error } = await db
  .from('matches')
  .select('id,home_team,away_team')
if (error) throw error

const aliases = new Map([
  ['刚果金', '刚果(金)'],
  ['阿尔及利', '阿尔及利亚'],
])
let updated = 0
for (const match of payload.value.matchInfoList.flatMap(
  (group) => group.subMatchList,
)) {
  if (!match.leagueAllName.includes('世界杯')) continue
  const home = aliases.get(match.homeTeamAbbName) || match.homeTeamAbbName
  const away = aliases.get(match.awayTeamAbbName) || match.awayTeamAbbName
  const stored = (databaseMatches || []).find(
    (item) => item.home_team === home && item.away_team === away,
  )
  if (!stored) continue

  const { error: updateError } = await db
    .from('matches')
    .update({
      kickoff_at: `${match.matchDate}T${match.matchTime}+08:00`,
      odds_h: numberOrNull(match.had?.h),
      odds_d: numberOrNull(match.had?.d),
      odds_a: numberOrNull(match.had?.a),
      handicap_value: numberOrNull(match.hhad?.goalLineValue),
      odds_handicap_h: numberOrNull(match.hhad?.h),
      odds_handicap_d: numberOrNull(match.hhad?.d),
      odds_handicap_a: numberOrNull(match.hhad?.a),
    })
    .eq('id', stored.id)
  if (updateError) throw updateError
  updated++
}
console.log(`Updated ${updated} Sporttery matches`)

type SportteryMatch = {
  leagueAllName: string
  homeTeamAbbName: string
  awayTeamAbbName: string
  matchDate: string
  matchTime: string
  had?: { h?: string; d?: string; a?: string }
  hhad?: {
    h?: string
    d?: string
    a?: string
    goalLineValue?: string
  }
}

function numberOrNull(value?: string) {
  if (!value) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}
