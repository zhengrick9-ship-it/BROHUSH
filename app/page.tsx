'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { DogMark } from '@/app/components/DogMark'

export default function HomePage() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    sessionStorage.removeItem('twodogs_session_token')
    localStorage.removeItem('twodogs_name')
  }, [])

  const handleEnter = async () => {
    const normalizedName = name.trim()
    if (!['木四', '听课', '饼干'].includes(normalizedName)) {
      setError('名字不对')
      return
    }

    setSubmitting(true)
    setError('')

    const response = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: normalizedName }),
    })
    if (!response.ok) {
      const body = await response.json()
      setSubmitting(false)
      setError(body.error || '无法登录')
      return
    }

    const body = await response.json()
    sessionStorage.setItem('twodogs_session_token', body.token)
    router.replace('/projects/wcw2026')
  }

  return (
    <main className="min-h-screen px-6 py-10 md:py-16">
      <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl items-center gap-14 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="max-w-2xl">
          <div className="mb-10 flex items-center gap-5 text-[var(--accent)]">
            <DogMark className="login-dog-mark" />
            <span className="text-lg font-semibold tracking-[0.2em] text-[var(--text)] md:text-xl">
              2DOGS
            </span>
          </div>
          <p className="section-label mb-5">WCW2026</p>
          <h1 className="font-display max-w-xl text-4xl leading-[1.12] tracking-[-0.035em] text-[var(--text)] md:text-6xl">
            失败是成功之母，
            <br />
            投注是成功支付
          </h1>
        </section>

        <section className="login-panel">
          <p className="section-label mb-3">进入看板</p>
          <form
            className="mt-5 space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              handleEnter()
            }}
          >
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="input"
              placeholder="名字"
              aria-label="输入你的名字"
              autoFocus
            />
            {error && <p className="text-sm text-[var(--red)]">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="primary-button w-full"
            >
              {submitting ? '进入中…' : '进入 2DOGS'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
