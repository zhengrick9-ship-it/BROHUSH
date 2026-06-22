import { NextResponse } from 'next/server'

import {
  clearEditorSession,
  createEditorSession,
} from '@/lib/auth/session'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''

    if (!name || name.length > 24) {
      return NextResponse.json({ error: '请输入 1-24 个字符的名字' }, { status: 400 })
    }

    const token = await createEditorSession(name)
    return NextResponse.json({ ok: true, name, token })
  } catch {
    return NextResponse.json({ error: '无法建立会话' }, { status: 400 })
  }
}

export async function DELETE() {
  await clearEditorSession()
  return NextResponse.json({ ok: true })
}
