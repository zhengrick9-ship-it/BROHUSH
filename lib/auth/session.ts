import 'server-only'

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'twodogs_session_v2'
const SESSION_AGE = 60 * 60 * 12

export async function createEditorSession(name: string) {
  const token = randomBytes(32).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({
      name,
      token,
      expiresAt: Date.now() + SESSION_AGE * 1000,
    }),
  ).toString('base64url')
  const value = `${payload}.${sign(payload)}`
  const store = await cookies()

  store.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
  return token
}

export async function clearEditorSession() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
  store.delete('twodogs_editor')
}

export async function getEditorSession(
  request: Request,
): Promise<{ name: string } | null> {
  const store = await cookies()
  const value = store.get(COOKIE_NAME)?.value
  if (!value) return null

  const [payload, signature] = value.split('.')
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (
      typeof parsed.name !== 'string' ||
      typeof parsed.token !== 'string' ||
      typeof parsed.expiresAt !== 'number' ||
      parsed.expiresAt <= Date.now() ||
      !safeEqual(request.headers.get('x-session-token') || '', parsed.token)
    ) {
      return null
    }
    return { name: parsed.name }
  } catch {
    return null
  }
}

export async function requireEditorSession(request: Request) {
  const session = await getEditorSession(request)
  if (!session) throw new Error('UNAUTHORIZED')
  return session
}

function sign(payload: string) {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('缺少会话签名配置')
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}
