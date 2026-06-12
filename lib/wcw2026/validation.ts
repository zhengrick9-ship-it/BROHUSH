import type { MatchStatus, Outcome } from './types.ts'

const outcomes = new Set<Outcome>(['H', 'D', 'A'])

export function parseMatchResultInput(input: unknown): {
  homeScore: number | null
  awayScore: number | null
  actualResult: Outcome | null
  status: MatchStatus
} {
  if (!isObject(input)) throw new Error('无效的赛果数据')

  const homeScore = input.homeScore
  const awayScore = input.awayScore

  if (homeScore == null && awayScore == null) {
    return {
      homeScore: null,
      awayScore: null,
      actualResult: null,
      status: 'scheduled',
    }
  }

  if (homeScore == null || awayScore == null) {
    throw new Error('比分必须同时填写或同时清空')
  }
  if (!isScore(homeScore) || !isScore(awayScore)) {
    throw new Error('比分必须是非负整数')
  }

  return {
    homeScore,
    awayScore,
    actualResult: homeScore > awayScore ? 'H' : homeScore < awayScore ? 'A' : 'D',
    status: 'finished',
  }
}

export function parseBetInput(input: unknown): {
  id?: string
  matchId: string
  direction: Outcome
  odds: number
  stake: number
} {
  if (!isObject(input)) throw new Error('无效的投注数据')

  const id = typeof input.id === 'string' && input.id ? input.id : undefined
  const matchId = typeof input.matchId === 'string' ? input.matchId.trim() : ''
  const direction = input.direction
  const odds = Number(input.odds)
  const stake = Number(input.stake)

  if (!matchId) throw new Error('必须选择比赛')
  if (!outcomes.has(direction as Outcome)) throw new Error('投注方向无效')
  if (!Number.isFinite(odds) || odds <= 1) throw new Error('赔率必须大于 1')
  if (!Number.isFinite(stake) || stake <= 0) throw new Error('金额必须大于 0')

  return {
    ...(id ? { id } : {}),
    matchId,
    direction: direction as Outcome,
    odds: roundMoney(odds),
    stake: roundMoney(stake),
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isScore(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

