import { createClient } from '@supabase/supabase-js'

import { WORLD_CUP_FIXTURES } from '../lib/wcw2026/fixtures.ts'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const migratedRead = await supabase
  .from('matches')
  .select('id,source_match_number,home_team,away_team')

const hasMigration = !migratedRead.error
const current = (hasMigration
  ? migratedRead.data
  : (
      await supabase
        .from('matches')
        .select('id,home_team,away_team')
    ).data) as Array<{
      id: string
      source_match_number?: number | null
      home_team: string
      away_team: string
    }> | null
const existingByNumber = new Map(
  (current || [])
    .filter(
      (match) => match.source_match_number != null,
    )
    .map((match) => [
      match.source_match_number as number,
      match,
    ]),
)
const existingByTeams = new Map(
  (current || []).map((match) => [
    `${match.home_team}__${match.away_team}`,
    match,
  ]),
)

for (const fixture of WORLD_CUP_FIXTURES) {
  const stored =
    existingByNumber.get(fixture.sourceMatchNumber) ||
    existingByTeams.get(`${fixture.homeTeam}__${fixture.awayTeam}`)
  const payload = {
    match_date: fixture.matchDate,
    group_name: fixture.groupName,
    home_team: fixture.homeTeam,
    away_team: fixture.awayTeam,
    ...(!stored ? { match_status: 'scheduled' } : {}),
    ...(hasMigration
      ? {
          source_match_number: fixture.sourceMatchNumber,
          stage: fixture.stage,
          round_number: fixture.roundNumber,
        }
      : {}),
  }

  const query = stored?.id
    ? supabase.from('matches').update(payload).eq('id', stored.id)
    : supabase.from('matches').insert(payload)
  const { error } = await query
  if (error) throw new Error(`Match ${fixture.sourceMatchNumber}: ${error.message}`)
}

console.log(`Seeded ${WORLD_CUP_FIXTURES.length} World Cup fixtures`)
