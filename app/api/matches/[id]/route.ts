import { NextResponse } from 'next/server'

import { requireEditorSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { settleBet } from '@/lib/wcw2026/metrics'
import { parseMatchResultInput } from '@/lib/wcw2026/validation'
import type { Bet, Match } from '@/lib/wcw2026/types'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireEditorSession(request)
    const { id } = await context.params
    if (id.startsWith('schedule-')) {
      return NextResponse.json(
        { error: '请先执行数据库迁移后再录入该场赛果' },
        { status: 409 },
      )
    }
    const result = parseMatchResultInput(await request.json())
    const supabase = createAdminClient()

    const { data: match, error: matchError } = await supabase
      .from('matches')
      .update({
        home_score: result.homeScore,
        away_score: result.awayScore,
        actual_result: result.actualResult,
        match_status: result.status,
      })
      .eq('id', id)
      .select()
      .single()
    if (matchError || !match) throw matchError || new Error('比赛不存在')

    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select('*')
      .eq('match_id', id)
    if (betsError) throw betsError

    for (const bet of (bets || []) as Bet[]) {
      const settled = settleBet(bet, match as Match)
      const { error } = await supabase
        .from('bets')
        .update({ result: settled.result, profit: settled.profit })
        .eq('id', bet.id)
      if (error) throw error
    }

    return NextResponse.json(match)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: '需要编辑权限' }, { status: 401 })
    }
    if (error instanceof Error && /比分|无效/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Failed to save result', error)
    return NextResponse.json({ error: '赛果保存失败' }, { status: 500 })
  }
}
