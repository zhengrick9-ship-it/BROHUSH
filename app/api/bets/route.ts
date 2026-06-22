import { NextResponse } from 'next/server'
import {
  ownerNameForWrite,
  ownerNamesForSession,
  requirePrivilegedSession,
} from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { settleBet } from '@/lib/wcw2026/metrics'
import { parseBetInput } from '@/lib/wcw2026/validation'
import type { Bet, Match } from '@/lib/wcw2026/types'

export async function GET(request: Request) {
  const session = await requirePrivilegedSession(request)
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .in('owner_name', ownerNamesForSession(session.name))
    .order('created_at')
  if (error) return NextResponse.json({ error: '投注读取失败' }, { status: 502 })
  return NextResponse.json(data || [])
}

export async function POST(request: Request) {
  try {
    const session = await requirePrivilegedSession(request)
    const input = parseBetInput(await request.json())
    if (input.matchId.startsWith('schedule-')) {
      return NextResponse.json(
        { error: '请先执行数据库迁移后再录入该场投注' },
        { status: 409 },
      )
    }

    const supabase = createAdminClient()
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', input.matchId)
      .single()
    if (matchError || !match) {
      return NextResponse.json({ error: '比赛不存在' }, { status: 404 })
    }

    const baseBet: Bet = {
      id: input.id || '',
      match_id: input.matchId,
      owner_name: ownerNameForWrite(session.name),
      market: input.market,
      handicap: input.handicap,
      direction: input.direction,
      odds: input.odds,
      stake: input.stake,
      result: 'pending',
      profit: 0,
      created_at: new Date().toISOString(),
    }
    const settled = settleBet(baseBet, match as Match)
    const payload = {
      match_id: settled.match_id,
      owner_name: ownerNameForWrite(session.name),
      market: settled.market || 'win_draw_loss',
      handicap: settled.handicap || 0,
      direction: settled.direction,
      odds: settled.odds,
      stake: settled.stake,
      result: settled.result,
      profit: settled.profit,
    }

    if (input.id) {
      const { data, error } = await supabase
        .from('bets')
        .update(payload)
        .eq('id', input.id)
        .in('owner_name', ownerNamesForSession(session.name))
        .select()
        .single()
      if (error) throw error
      return NextResponse.json(data)
    }

    const { data, error } = await supabase.from('bets').insert(payload).select().single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: '需要编辑权限' }, { status: 401 })
    }
    if (error instanceof Error && /必须|无效|大于/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Failed to save bet', error)
    return NextResponse.json({ error: '投注保存失败' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requirePrivilegedSession(request)
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: '缺少投注 ID' }, { status: 400 })
    const { error } = await createAdminClient()
      .from('bets')
      .delete()
      .eq('id', id)
      .in('owner_name', ownerNamesForSession(session.name))
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: '需要编辑权限' }, { status: 401 })
    }
    return NextResponse.json({ error: '投注删除失败' }, { status: 500 })
  }
}
