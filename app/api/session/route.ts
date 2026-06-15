import { NextResponse } from 'next/server'

import {
  clearEditorSession,
  createEditorSession,
} from '@/lib/auth/session'

const allowedNames = new Set(['木四', '听课', '饼干'])

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''

    if (!allowedNames.has(name)) {
      return NextResponse.json({ error: '名字不对' }, { status: 400 })
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
