import { createClient } from '@supabase/supabase-js'

import { WORLD_CUP_FIXTURES } from '../lib/wcw2026/fixtures.ts'
import type { Outcome, TicketRecord } from '../lib/wcw2026/types.ts'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
}

const db = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

type Owner = '木四' | '听课' | '饼干'
type SingleInput = {
  sourceMatchNumber: number
  market?: 'win_draw_loss' | 'handicap'
  handicap?: number
  direction: Outcome
  odds: number
  stake: number
  purchasedAt: string
}

const commonSingles: SingleInput[] = [
  single(1, 'A', 8.4, '2026-06-10T13:42:30+08:00'),
  single(2, 'H', 2.43, '2026-06-10T13:42:30+08:00'),
  single(3, 'H', 1.59, '2026-06-10T13:42:30+08:00'),
  single(4, 'A', 3.92, '2026-06-10T13:42:30+08:00'),
  single(6, 'H', 1.53, '2026-06-10T13:42:30+08:00'),
  single(7, 'H', 5.15, '2026-06-10T13:42:30+08:00'),
  single(11, 'A', 3.92, '2026-06-10T13:42:30+08:00'),
  single(12, 'A', 4.3, '2026-06-10T13:42:30+08:00'),
  single(16, 'A', 5.85, '2026-06-10T13:45:28+08:00'),
  single(13, 'H', 8.45, '2026-06-10T13:45:28+08:00'),
  single(17, 'A', 6.75, '2026-06-10T13:45:28+08:00'),
  single(20, 'A', 8.9, '2026-06-10T13:45:28+08:00'),
  single(22, 'A', 5.25, '2026-06-10T13:45:28+08:00'),
  single(21, 'A', 3.6, '2026-06-10T13:45:28+08:00'),
]

const commonTickets: Omit<TicketRecord, 'ownerName' | 'ticketNumber'>[] = [
  ticket(
    'system-494',
    '8 场 · 2/3/4/5/6/7/8 关',
    494,
    1,
    [2, 3, 4, 5, 6, 7, 8],
    '2026-06-11T13:06:00+08:00',
    '494元8关全.jpg',
    4342421.69,
    [
      leg(2, 'handicap', -1, 'H', 5.95),
      leg(6, 'win_draw_loss', 0, 'A', 5.25),
      leg(11, 'win_draw_loss', 0, 'A', 3.92),
      leg(9, 'handicap', 1, 'A', 5.3),
      leg(12, 'handicap', -1, 'H', 3.55),
      leg(16, 'win_draw_loss', 0, 'A', 5.85),
      leg(19, 'win_draw_loss', 0, 'A', 8.9),
      leg(21, 'handicap', -1, 'H', 4.25),
    ],
  ),
  ticket(
    'sixfold-10',
    '6×1 · 5 倍',
    10,
    5,
    [6],
    '2026-06-11T13:09:26+08:00',
    '10元6×1.jpg',
    74439.2,
    [
      leg(2, 'handicap', -1, 'H', 5.95),
      leg(4, 'handicap', -1, 'H', 3.7),
      leg(6, 'win_draw_loss', 0, 'A', 5.25),
      leg(11, 'win_draw_loss', 0, 'A', 3.92),
      leg(9, 'handicap', 1, 'A', 5.3),
      leg(15, 'handicap', -1, 'H', 3.1),
    ],
  ),
  ticket(
    'system-186',
    '8 场 · 5/6/7/8 关',
    186,
    1,
    [5, 6, 7, 8],
    '2026-06-14T12:00:00+08:00',
    '186元5678关.jpg',
    292573.09,
    [
      leg(8, 'handicap', 2, 'A', 2.52),
      leg(6, 'win_draw_loss', 0, 'D', 3.55),
      leg(7, 'handicap', 1, 'A', 2.84),
      leg(11, 'win_draw_loss', 0, 'D', 3.3),
      leg(12, 'handicap', -1, 'H', 3.45),
      leg(15, 'handicap', -1, 'H', 3.1),
      leg(9, 'handicap', 1, 'A', 5.3),
      leg(21, 'handicap', -1, 'H', 4.25),
    ],
  ),
  ticket(
    'fourfold-100',
    '4×1 · 50 倍',
    100,
    50,
    [4],
    '2026-06-14T12:00:00+08:00',
    '100元德国等4串.png',
    19512.5,
    [
      leg(10, 'handicap', -3, 'A', 3.05),
      leg(11, 'win_draw_loss', 0, 'D', 3.38),
      leg(9, 'handicap', 1, 'A', 5.65),
      leg(12, 'handicap', -1, 'H', 3.35),
    ],
  ),
  ticket(
    'triple-96',
    '4 场 · 3 关 · 12 倍',
    96,
    12,
    [3],
    '2026-06-14T12:00:00+08:00',
    '96元德国等3关.png',
    5147.64,
    [
      leg(10, 'handicap', -3, 'A', 3.05),
      leg(11, 'win_draw_loss', 0, 'D', 3.38),
      leg(9, 'handicap', 1, 'A', 5.65),
      leg(12, 'handicap', -1, 'H', 3.35),
    ],
  ),
]

const biscuitSingles: SingleInput[] = [
  ...commonSingles,
  single(3, 'A', 4.75, '2026-06-12T12:46:39+08:00'),
  single(4, 'A', 4.05, '2026-06-12T12:46:39+08:00'),
  single(6, 'A', 5.4, '2026-06-13T14:36:52+08:00', 50),
  single(6, 'A', 5.4, '2026-06-13T14:36:54+08:00', 50),
]

const biscuitTickets: Omit<TicketRecord, 'ownerName' | 'ticketNumber'>[] = [
  ...commonTickets,
  ticket(
    'haiti-australia-1',
    '海地 / 澳大利亚 · 2×1',
    100,
    50,
    [2],
    '2026-06-13T22:18:33+08:00',
    '200元海地澳大利亚.jpg',
    588.5,
    [
      leg(5, 'handicap', 1, 'A', 2.03),
      leg(7, 'handicap', 1, 'A', 2.9),
    ],
  ),
  ticket(
    'haiti-australia-2',
    '海地 / 澳大利亚 · 2×1',
    100,
    50,
    [2],
    '2026-06-13T22:18:35+08:00',
    '200元海地澳大利亚.jpg',
    588.5,
    [
      leg(5, 'handicap', 1, 'A', 2.03),
      leg(7, 'handicap', 1, 'A', 2.9),
    ],
  ),
  ticket(
    'system-360',
    '4 场 · 2/3/4 关 · 10 倍',
    360,
    10,
    [2, 3, 4],
    '2026-06-14T12:00:00+08:00',
    '360元4场串.png',
    9067.9,
    [
      leg(10, 'handicap', -3, 'D', 4.8),
      leg(11, 'win_draw_loss', 0, 'D', 3.43),
      leg(9, 'win_draw_loss', 0, 'H', 3.15),
      leg(9, 'win_draw_loss', 0, 'D', 2.65),
      leg(12, 'handicap', -1, 'H', 3.4),
    ],
  ),
  {
    ...ticket(
      'belgium-champion',
      '比利时 · 世界杯冠军',
      100,
      50,
      [],
      '2026-06-07T15:23:35+08:00',
      '100比利时.jpg',
      2300,
      [],
    ),
    potentialPayout: 2300,
  },
]

const users: Array<{
  owner: Owner
  key: string
  singles: SingleInput[]
  tickets: Omit<TicketRecord, 'ownerName' | 'ticketNumber'>[]
  expectedTotal: number
}> = [
  {
    owner: '木四',
    key: 'musi',
    singles: commonSingles,
    tickets: commonTickets,
    expectedTotal: 2286,
  },
  {
    owner: '听课',
    key: 'tingke',
    singles: commonSingles,
    tickets: commonTickets,
    expectedTotal: 2286,
  },
  {
    owner: '饼干',
    key: 'biscuit',
    singles: biscuitSingles,
    tickets: biscuitTickets,
    expectedTotal: 3246,
  },
]

const totals = users.map((user) => ({
  owner: user.owner,
  total:
    user.singles.reduce((sum, item) => sum + item.stake, 0) +
    user.tickets.reduce((sum, item) => sum + item.stake, 0),
  expected: user.expectedTotal,
}))
for (const row of totals) {
  if (row.total !== row.expected) {
    throw new Error(`${row.owner} total ${row.total}, expected ${row.expected}`)
  }
}

const { data: matches, error: matchError } = await db
  .from('matches')
  .select('id,source_match_number')
if (matchError) throw matchError
const matchIds = new Map(
  (matches || []).map((match) => [match.source_match_number, match.id]),
)
for (const fixture of WORLD_CUP_FIXTURES) {
  if (!matchIds.has(fixture.sourceMatchNumber)) {
    throw new Error(`Missing match ${fixture.sourceMatchNumber}`)
  }
}

const { error: clearBetsError } = await db
  .from('bets')
  .delete()
  .in('owner_name', users.map((user) => user.owner))
if (clearBetsError) throw clearBetsError
const { error: clearTicketsError } = await db
  .from('bet_tickets')
  .delete()
  .in('owner_name', users.map((user) => user.owner))
if (clearTicketsError) throw clearTicketsError

for (const user of users) {
  const betRows = user.singles.map((item) => ({
    match_id: matchIds.get(item.sourceMatchNumber),
    owner_name: user.owner,
    market: item.market || 'win_draw_loss',
    handicap: item.handicap || 0,
    direction: item.direction,
    odds: item.odds,
    stake: item.stake,
    result: 'pending',
    profit: 0,
    created_at: item.purchasedAt,
  }))
  const { error: betError } = await db.from('bets').insert(betRows)
  if (betError) throw betError

  for (const [index, item] of user.tickets.entries()) {
    const id = `${user.key}-${item.id}`
    const { error: ticketError } = await db.from('bet_tickets').insert({
      id,
      owner_name: user.owner,
      ticket_number: index + 1,
      label: item.label,
      purchased_at: item.purchasedAt,
      stake: item.stake,
      base_stake: item.baseStake,
      multiplier: item.multiplier,
      pass_types: item.passTypes,
      result: item.result,
      profit: item.profit,
      potential_payout: item.potentialPayout,
      source_image: item.sourceImage,
      needs_review: false,
    })
    if (ticketError) throw ticketError
    if (item.legs.length) {
      const { error: legError } = await db.from('bet_legs').insert(
        item.legs.map((itemLeg) => ({
          ticket_id: id,
          source_match_number: itemLeg.sourceMatchNumber,
          market: itemLeg.market,
          handicap: itemLeg.handicap,
          direction: itemLeg.direction,
          odds: itemLeg.odds,
        })),
      )
      if (legError) throw legError
    }
  }
}

console.table(totals)

function single(
  sourceMatchNumber: number,
  direction: Outcome,
  odds: number,
  purchasedAt: string,
  stake = 100,
): SingleInput {
  return { sourceMatchNumber, direction, odds, stake, purchasedAt }
}

function leg(
  sourceMatchNumber: number,
  market: 'win_draw_loss' | 'handicap',
  handicap: number,
  direction: Outcome,
  odds: number,
) {
  return { sourceMatchNumber, market, handicap, direction, odds }
}

function ticket(
  id: string,
  label: string,
  stake: number,
  multiplier: number,
  passTypes: number[],
  purchasedAt: string,
  sourceImage: string,
  potentialPayout: number,
  legs: TicketRecord['legs'],
): Omit<TicketRecord, 'ownerName' | 'ticketNumber'> {
  return {
    id,
    label,
    stake,
    baseStake: 2,
    multiplier,
    passTypes,
    purchasedAt,
    result: 'pending',
    profit: 0,
    potentialPayout,
    sourceImage,
    needsReview: false,
    legs,
  }
}
