import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildTimeline,
  getRoundKey,
  settleBet,
  settleTicket,
  summarizeBets,
} from './metrics.ts'
import type { Bet, Match, TicketRecord } from './types.ts'

const finishedMatch: Match = {
  id: 'match-1',
  match_date: '2026-06-12',
  stage: 'group',
  round_number: 1,
  home_team: '韩国',
  away_team: '捷克',
  odds_h: 2.43,
  odds_d: 3.2,
  odds_a: 3,
  prediction: 'H',
  model_prob_h: 0.5,
  model_prob_d: 0.25,
  model_prob_a: 0.25,
  edge_pct: 10,
  strategy_tag: 'Value',
  actual_result: 'H',
  home_score: 2,
  away_score: 1,
  match_status: 'finished',
}

const winningBet: Bet = {
  id: 'bet-1',
  match_id: 'match-1',
  direction: 'H',
  odds: 2.43,
  stake: 100,
  result: 'pending',
  profit: 0,
  created_at: '2026-06-10T12:00:00Z',
}

test('settleBet calculates net profit from the finished match result', () => {
  assert.deepEqual(settleBet(winningBet, finishedMatch), {
    ...winningBet,
    result: 'won',
    profit: 143,
  })
})

test('settleBet applies handicap market outcome', () => {
  assert.deepEqual(
    settleBet(
      {
        ...winningBet,
        market: 'handicap',
        handicap: -1,
        direction: 'D',
      },
      finishedMatch,
    ).result,
    'won',
  )
})

test('summarizeBets counts shared bets once and uses settled stake for ROI', () => {
  const settled = settleBet(winningBet, finishedMatch)
  const pending = {
    ...winningBet,
    id: 'bet-2',
    match_id: 'match-2',
    stake: 80,
  }

  assert.deepEqual(summarizeBets([settled, pending]), {
    totalStake: 180,
    settledStake: 100,
    settledPayout: 243,
    settledProfit: 143,
    roi: 143,
    won: 1,
    lost: 0,
    pending: 1,
  })
})

test('getRoundKey uses group round metadata and stable knockout labels', () => {
  assert.deepEqual(getRoundKey(finishedMatch), {
    id: 'group-1',
    label: '小组赛 第 1 轮',
    order: 1,
  })
  assert.deepEqual(getRoundKey({ ...finishedMatch, stage: 'final', round_number: null }), {
    id: 'final',
    label: '决赛',
    order: 90,
  })
})

test('buildTimeline accumulates stake on bet date and profit on settlement date', () => {
  const settled = settleBet(winningBet, finishedMatch)
  assert.deepEqual(buildTimeline([settled], [finishedMatch]), [
    { date: '2026-06-10', stake: 100, profit: 0 },
    { date: '2026-06-12', stake: 100, profit: 143 },
  ])
})

test('ticket-level stakes are counted once without settling unfinished parlays', () => {
  const ticket: TicketRecord = {
    id: 'ticket-1',
    label: '6×1',
    stake: 10,
    baseStake: 2,
    multiplier: 5,
    passTypes: [6],
    purchasedAt: '2026-06-11T13:09:26+08:00',
    result: 'pending',
    profit: 0,
    sourceImage: 'ticket.jpg',
    legs: [],
  }

  assert.equal(summarizeBets([winningBet], [ticket]).totalStake, 110)
  assert.deepEqual(buildTimeline([winningBet], [finishedMatch], [ticket])[0], {
    date: '2026-06-10',
    stake: 100,
    profit: 0,
  })
  assert.deepEqual(buildTimeline([winningBet], [finishedMatch], [ticket])[1], {
    date: '2026-06-11',
    stake: 110,
    profit: 0,
  })
})

test('settleTicket applies the home handicap before checking a leg', () => {
  const ticket: TicketRecord = {
    id: 'sixfold',
    label: '6×1',
    stake: 10,
    baseStake: 2,
    multiplier: 5,
    passTypes: [6],
    purchasedAt: '2026-06-11T13:00:00+08:00',
    result: 'pending',
    profit: 0,
    sourceImage: 'ticket.jpg',
    legs: [
      {
        sourceMatchNumber: 2,
        market: 'handicap',
        handicap: -1,
        direction: 'H',
        odds: 5.95,
      },
      ...Array.from({ length: 5 }, (_, index) => ({
        sourceMatchNumber: 10 + index,
        market: 'win_draw_loss' as const,
        handicap: 0,
        direction: 'H' as const,
        odds: 2,
      })),
    ],
  }
  const matches = [
    { ...finishedMatch, source_match_number: 2 },
    ...Array.from({ length: 5 }, (_, index) => ({
      ...finishedMatch,
      id: `pending-${index}`,
      source_match_number: 10 + index,
      match_status: 'scheduled' as const,
      actual_result: null,
      home_score: null,
      away_score: null,
    })),
  ]

  assert.deepEqual(settleTicket(ticket, matches), {
    ...ticket,
    result: 'lost',
    payout: 0,
    settledStake: 10,
    minPayout: 0,
    maxPayout: 0,
    minProfit: -10,
    maxProfit: -10,
    profit: -10,
    settledAt: '2026-06-12',
  })
})

test('settleTicket pays only combinations made entirely from winning legs', () => {
  const ticket: TicketRecord = {
    id: 'system',
    label: '3 场 2/3 关',
    stake: 8,
    baseStake: 2,
    multiplier: 1,
    passTypes: [2, 3],
    purchasedAt: '2026-06-11T13:00:00+08:00',
    result: 'pending',
    profit: 0,
    sourceImage: 'ticket.jpg',
    legs: [
      { sourceMatchNumber: 1, market: 'win_draw_loss', handicap: 0, direction: 'H', odds: 2 },
      { sourceMatchNumber: 2, market: 'win_draw_loss', handicap: 0, direction: 'H', odds: 3 },
      { sourceMatchNumber: 3, market: 'win_draw_loss', handicap: 0, direction: 'A', odds: 4 },
    ],
  }
  const matches = [1, 2, 3].map((number) => ({
    ...finishedMatch,
    id: `match-${number}`,
    source_match_number: number,
  }))

  assert.deepEqual(settleTicket(ticket, matches), {
    ...ticket,
    result: 'won',
    payout: 12,
    settledStake: 8,
    minPayout: 12,
    maxPayout: 12,
    minProfit: 4,
    maxProfit: 4,
    profit: 4,
    settledAt: '2026-06-12',
  })
})

test('shared dashboard can aggregate two identical participant portfolios', () => {
  const settled = settleBet(winningBet, finishedMatch)
  assert.deepEqual(summarizeBets([settled], [], 2), {
    totalStake: 200,
    settledStake: 200,
    settledPayout: 486,
    settledProfit: 286,
    roi: 143,
    won: 1,
    lost: 0,
    pending: 0,
  })
  assert.equal(buildTimeline([settled], [finishedMatch], [], 2)[0].stake, 200)
})

test('system ticket recognizes settled combinations before every leg finishes', () => {
  const ticket: TicketRecord = {
    id: 'partial-system',
    label: '3 场 2 关',
    stake: 6,
    baseStake: 2,
    multiplier: 1,
    passTypes: [2],
    purchasedAt: '2026-06-11T13:00:00+08:00',
    result: 'pending',
    profit: 0,
    sourceImage: 'ticket.jpg',
    legs: [
      { sourceMatchNumber: 1, market: 'win_draw_loss', handicap: 0, direction: 'H', odds: 2 },
      { sourceMatchNumber: 2, market: 'win_draw_loss', handicap: 0, direction: 'A', odds: 3 },
      { sourceMatchNumber: 3, market: 'win_draw_loss', handicap: 0, direction: 'H', odds: 4 },
    ],
  }
  const matches: Match[] = [
    { ...finishedMatch, source_match_number: 1 },
    {
      ...finishedMatch,
      id: 'lost',
      source_match_number: 2,
      actual_result: 'H',
    },
    {
      ...finishedMatch,
      id: 'pending',
      source_match_number: 3,
      match_status: 'scheduled',
      actual_result: null,
      home_score: null,
      away_score: null,
    },
  ]

  const settled = settleTicket(ticket, matches)
  assert.equal(settled.result, 'pending')
  assert.equal(settled.settledStake, 4)
  assert.equal(settled.payout, 0)
  assert.equal(settled.minProfit, -6)
  assert.equal(settled.maxProfit, 10)
})

test('system ticket treats multiple selections in one match as alternatives', () => {
  const ticket: TicketRecord = {
    id: 'multi-option',
    label: '4 场 2/3/4 关',
    stake: 36,
    baseStake: 2,
    multiplier: 1,
    passTypes: [2, 3, 4],
    purchasedAt: '2026-06-14T12:00:00+08:00',
    result: 'pending',
    profit: 0,
    sourceImage: 'ticket.jpg',
    legs: [
      { sourceMatchNumber: 1, market: 'handicap', handicap: -3, direction: 'D', odds: 4.8 },
      { sourceMatchNumber: 2, market: 'win_draw_loss', handicap: 0, direction: 'D', odds: 3.43 },
      { sourceMatchNumber: 3, market: 'win_draw_loss', handicap: 0, direction: 'H', odds: 3.15 },
      { sourceMatchNumber: 3, market: 'win_draw_loss', handicap: 0, direction: 'D', odds: 2.65 },
      { sourceMatchNumber: 4, market: 'handicap', handicap: -1, direction: 'H', odds: 3.4 },
    ],
  }
  const settled = settleTicket(ticket, [])
  assert.equal(settled.settledStake, 0)
  assert.equal(settled.maxPayout, 906.79)
})

test('system ticket rounds each base combination before applying multiplier', () => {
  const ticket: TicketRecord = {
    id: 'multi-option-multiplied',
    label: '4 场 2/3/4 关 · 10 倍',
    stake: 360,
    baseStake: 2,
    multiplier: 10,
    passTypes: [2, 3, 4],
    purchasedAt: '2026-06-14T12:00:00+08:00',
    result: 'pending',
    profit: 0,
    sourceImage: 'ticket.jpg',
    legs: [
      { sourceMatchNumber: 1, market: 'handicap', handicap: -3, direction: 'D', odds: 4.8 },
      { sourceMatchNumber: 2, market: 'win_draw_loss', handicap: 0, direction: 'D', odds: 3.43 },
      { sourceMatchNumber: 3, market: 'win_draw_loss', handicap: 0, direction: 'H', odds: 3.15 },
      { sourceMatchNumber: 3, market: 'win_draw_loss', handicap: 0, direction: 'D', odds: 2.65 },
      { sourceMatchNumber: 4, market: 'handicap', handicap: -1, direction: 'H', odds: 3.4 },
    ],
  }

  const settled = settleTicket(ticket, [])
  assert.equal(settled.maxPayout, 9067.9)
  assert.equal(settled.maxProfit, 8707.9)
})

test('score ticket settles only on the exact final score', () => {
  const ticket: TicketRecord = {
    id: 'exact-score',
    label: '比分单关',
    stake: 2,
    baseStake: 2,
    multiplier: 1,
    passTypes: [1],
    purchasedAt: '2026-06-11T13:00:00+08:00',
    result: 'pending',
    profit: 0,
    sourceImage: 'score.jpg',
    legs: [
      {
        sourceMatchNumber: 1,
        market: 'score',
        handicap: 0,
        direction: null,
        scoreHome: 2,
        scoreAway: 1,
        odds: 6.1,
      },
    ],
  }

  const settled = settleTicket(ticket, [
    { ...finishedMatch, source_match_number: 1 },
  ])
  assert.equal(settled.result, 'won')
  assert.equal(settled.payout, 12.2)
  assert.equal(settled.profit, 10.2)
})
