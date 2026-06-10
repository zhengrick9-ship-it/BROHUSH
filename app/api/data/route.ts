import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const [{ data: matches }, { data: bets }] = await Promise.all([
    supabase.from('matches').select('*').order('match_date').order('id'),
    supabase.from('bets').select('*').order('created_at', { ascending: false }),
  ])
  const total = (bets || []).length
  const half = Math.floor(total / 2)
  const musBets = (bets || []).slice(0, half).map(b => ({ ...b, person: '木四' }))
  const tkBets = (bets || []).slice(half).map(b => ({ ...b, person: '听课' }))
  return NextResponse.json({ matches: matches || [], bets: [...musBets, ...tkBets] })
}
