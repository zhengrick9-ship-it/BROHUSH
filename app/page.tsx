'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { DogMark } from '@/app/components/DogMark'

export default function HomePage() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem('twodogs_name')
    if (saved === '木四' || saved === '听课') {
      fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: saved }),
      }).then((response) => {
        if (response.ok) {
          router.replace('/projects/wcw2026')
        } else {
          localStorage.removeItem('twodogs_name')
          setChecking(false)
        }
      })
    } else {
      setChecking(false)
    }
  }, [router])

  const handleEnter = async () => {
    const normalizedName = name.trim()
    if (normalizedName !== '木四' && normalizedName !== '听课') {
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

    localStorage.setItem('twodogs_name', normalizedName)
    router.replace('/projects/wcw2026')
  }

  if (checking) {
    return <LoadingScreen />
  }

  return (
    <main className="min-h-screen px-6 py-10 md:py-16">
      <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl items-center gap-14 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="max-w-2xl">
          <div className="mb-14 flex items-center gap-4 text-[var(--accent)]">
            <DogMark />
            <span className="text-sm font-semibold tracking-[0.18em] text-[var(--text)]">
              2DOGS
            </span>
          </div>
          <p className="section-label mb-5">WCW2026 · 共同投注档案</p>
          <h1 className="font-display text-5xl leading-[0.98] tracking-[-0.04em] text-[var(--text)] md:text-7xl">
            YO BRO
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
function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-sm text-[var(--muted)]">载入中…</div>
    </div>
  )
}
