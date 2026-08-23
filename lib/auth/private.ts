import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "yolo_private_session_v1";
const SESSION_AGE = 60 * 60 * 24 * 7;
// The production Vercel project did not receive the local .env.local values.
// Keep the user's explicitly configured personal-site password functional while
// allowing a later Vercel environment variable to override it.
const FALLBACK_SESSION_SECRET = "yolo-private-session-20260823-local-fallback";
const FALLBACK_PRIVATE_PASSWORD = "121212";

function sessionSecret() {
  return process.env.SESSION_SECRET || FALLBACK_SESSION_SECRET;
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function equal(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isPrivatePasswordValid(input: string) {
  const expected = process.env.YOLO_PRIVATE_PASSWORD || FALLBACK_PRIVATE_PASSWORD;
  return equal(input, expected);
}

export async function createPrivateSession() {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + SESSION_AGE * 1000, nonce: randomBytes(18).toString("hex") }),
  ).toString("base64url");
  const store = await cookies();
  store.set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    // Local `next start` is served over HTTP. Production should explicitly set
    // YOLO_COOKIE_SECURE=true behind HTTPS.
    secure: process.env.YOLO_COOKIE_SECURE ? process.env.YOLO_COOKIE_SECURE === "true" : process.env.NODE_ENV === "production",
    maxAge: SESSION_AGE,
    path: "/",
  });
}

export async function clearPrivateSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function hasPrivateSession() {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !equal(signature, sign(payload))) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number; nonce?: string };
    return typeof parsed.exp === "number" && parsed.exp > Date.now() && typeof parsed.nonce === "string";
  } catch {
    return false;
  }
}

export async function requirePrivateSession(nextPath = "/trading") {
  if (!(await hasPrivateSession())) {
    redirect(`/private/login?next=${encodeURIComponent(nextPath)}`);
  }
}
