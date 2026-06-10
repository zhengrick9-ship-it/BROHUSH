import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase.from('bets').select('*')
  const half = Math.floor((data || []).length / 2)
  const all = (data || []).map((b, i) => ({ ...b, person: i < half ? '木四' : '听课' }))
  return NextResponse.json(all || [])
}
