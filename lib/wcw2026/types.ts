export type Outcome = 'H' | 'D' | 'A'
export type MatchStatus = 'scheduled' | 'finished'
export type BetResult = 'won' | 'lost' | 'pending'

export type Match = {
  id: string
  source_match_number?: number | null
  match_date: string
  kickoff_at?: string | null
  group_name?: string | null
  stage?: string | null
  round_number?: number | null
  home_team: string
  away_team: string
  odds_h: number | null
  odds_d: number | null
  odds_a: number | null
  prediction: Outcome | null
  model_prob_h: number | null
  model_prob_d: number | null
  model_prob_a: number | null
  edge_pct: number | null
  strategy_tag: string | null
  actual_result: Outcome | null
  home_score: number | null
  away_score: number | null
  match_status: MatchStatus
  created_at?: string
}

export type Bet = {
  id: string
  match_id: string
  direction: Outcome
  odds: number
  stake: number
  result: BetResult
  profit: number
  created_at: string
  shared_key?: string | null
}

export type Summary = {
  totalStake: number
  settledStake: number
  settledProfit: number
  roi: number
  won: number
  lost: number
  pending: number
}

export type TimelinePoint = {
  date: string
  stake: number
  profit: number
}

export type TicketRecord = {
  id: string
  label: string
  stake: number
  baseStake: number
  multiplier: number
  passTypes: number[]
  purchasedAt: string
  settledAt?: string | null
  result: BetResult
  profit: number
  sourceImage: string
  needsReview?: boolean
  legs: {
    sourceMatchNumber: number
    market: 'win_draw_loss' | 'handicap'
    handicap: number
    direction: Outcome
    odds: number
  }[]
}
