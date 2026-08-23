"use client";

import { FormEvent, useState } from "react";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const next = new URLSearchParams(window.location.search).get("next") || "/trading";
    const response = await fetch("/api/private/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, next }),
    });
    const result = (await response.json().catch(() => ({}))) as { ok?: boolean; next?: string; message?: string };
    if (response.ok && result.ok) {
      window.location.assign(result.next || "/trading");
      return;
    }
    setBusy(false);
    setMessage(result.message || "无法验证，请稍后再试");
  }

  return (
    <form className="private-login-form" onSubmit={submit}>
      <label htmlFor="private-password">访问密码</label>
      <input id="private-password" type="password" inputMode="numeric" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="输入密码" />
      <button type="submit" disabled={busy}>{busy ? "验证中…" : "进入交易库"}</button>
      {message && <p className="private-login-error" role="alert">{message}</p>}
    </form>
  );
}
