import { NextResponse } from "next/server";
import { createPrivateSession, isPrivatePasswordValid } from "@/lib/auth/private";

export const runtime = "nodejs";

function safeNext(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/trading";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { password?: unknown; next?: unknown };
  if (typeof body.password !== "string" || !isPrivatePasswordValid(body.password)) {
    return NextResponse.json({ ok: false, message: "密码不正确" }, { status: 401 });
  }
  await createPrivateSession();
  return NextResponse.json({ ok: true, next: safeNext(body.next) });
}
