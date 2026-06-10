import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [{ data: matches }, { data: bets }] = await Promise.all([
    supabase.from('matches').select('*').order('match_date').order('id'),
    supabase.from('bets').select('*').order('created_at', { ascending: false }),
  ])
  const half = Math.floor((bets || []).length / 2)
  const mus = (bets || []).slice(0, half).map(b => ({ ...b, person: '木四' }))
  const tk = (bets || []).slice(half).map(b => ({ ...b, person: '听课' }))
  return NextResponse.json({ matches: matches || [], bets: [...mus, ...tk] })
}
