'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [bets, setBets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return }
      setUser(user)
      supabase.from('bets').select('*').eq('user_id', user.id).then(({ data }) => setBets(data || []))
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-400">加载中...</div>

  const totalProfit = bets.reduce((s, b) => s + (b.profit || 0), 0)
  const totalStake = bets.reduce((s, b) => s + b.stake, 0)
  const won = bets.filter(b => b.result === 'won').length
  const completed = bets.filter(b => b.result !== 'pending').length

  return (
    <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">BRORUSH</h1>
          <p className="text-gray-500 text-sm mt-1">项目协作记录系统</p>
        </div>
        <button onClick={() => { supabase.auth.signOut(); window.location.href = '/login' }}
          className="text-xs text-gray-400 hover:text-gray-600">退出</button>
      </header>

      <a href="/projects/wcw2026" className="block">
        <div className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">🌍 WCW2026 世界杯投注分析</h2>
              <p className="text-gray-500 text-sm mt-1">24 场投注方案跟踪 · 盈亏统计 · 赛果更新</p>
            </div>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">进行中</span>
          </div>
          {bets.length > 0 && (
            <div className="flex gap-4 mt-3 text-xs">
              <span>投入: <strong>{totalStake}元</strong></span>
              <span className={totalProfit > 0 ? 'text-green-600' : totalProfit < 0 ? 'text-red-600' : ''}>
                盈亏: <strong>{totalProfit > 0 ? '+' : ''}{totalProfit}元</strong>
              </span>
              {completed > 0 && <span>战绩: {won}W/{completed - won}L</span>}
            </div>
          )}
        </div>
      </a>
    </div>
  )
}
