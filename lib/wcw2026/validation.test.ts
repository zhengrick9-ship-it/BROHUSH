import assert from 'node:assert/strict'
import test from 'node:test'

import { parseBetInput, parseMatchResultInput } from './validation.ts'

test('parseMatchResultInput accepts a complete score', () => {
  assert.deepEqual(parseMatchResultInput({ homeScore: 2, awayScore: 1 }), {
    homeScore: 2,
    awayScore: 1,
    actualResult: 'H',
    status: 'finished',
  })
})

test('parseMatchResultInput clears a result only when both scores are null', () => {
  assert.deepEqual(parseMatchResultInput({ homeScore: null, awayScore: null }), {
    homeScore: null,
    awayScore: null,
    actualResult: null,
    status: 'scheduled',
  })
  assert.throws(
    () => parseMatchResultInput({ homeScore: 1, awayScore: null }),
    /比分必须同时填写或同时清空/,
  )
})

test('parseBetInput rejects invalid odds and stake', () => {
  assert.throws(
    () => parseBetInput({ matchId: 'm1', direction: 'H', odds: 1, stake: 100 }),
    /赔率必须大于 1/,
  )
  assert.throws(
    () => parseBetInput({ matchId: 'm1', direction: 'H', odds: 2, stake: 0 }),
    /金额必须大于 0/,
  )
})

test('parseBetInput normalizes valid shared bet input', () => {
  assert.deepEqual(
    parseBetInput({ id: 'b1', matchId: 'm1', direction: 'A', odds: 3.92, stake: 100 }),
    {
      id: 'b1',
      matchId: 'm1',
      market: 'win_draw_loss',
      handicap: 0,
      direction: 'A',
      odds: 3.92,
      stake: 100,
    },
  )
})
