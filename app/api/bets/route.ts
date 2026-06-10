import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase.from('bets').select('*')
  const half = Math.floor((data || []).length / 2)
  const all = (data || []).map((b, i) => ({ ...b, person: i < half ? '木四' : '听课' }))
  return NextResponse.json(all || [])
}
