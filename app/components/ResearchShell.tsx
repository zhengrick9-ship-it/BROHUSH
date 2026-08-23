import Link from "next/link";
import type { ReactNode } from "react";
import { WorkspaceNav } from "./WorkspaceNav";

export function ResearchShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return <div className="workspace-layout">
    <WorkspaceNav />
    <main className="workspace-main"><section className="workspace-heading"><p className="section-label">{eyebrow}</p><div className="workspace-heading-copy"><h1>{title}</h1>{description && <p>{description}</p>}</div></section>{children}</main>
  </div>;
}

export function EmptyState({ label = "内容正在接入" }: { label?: string }) {
  return <div className="border border-dashed border-[var(--line-strong)] bg-[rgba(250,248,243,0.5)] px-6 py-10"><p className="section-label">{label}</p><p className="mt-3 max-w-xl text-sm leading-7 text-[var(--secondary)]">当前内容仍在本地研究层维护。研究结果会先完成证据、时间和质量标记，再发布到这里。</p></div>;
}

export function LinkCard({ href, label, title, text }: { href: string; label: string; title: string; text: string }) {
  return <Link href={href} className="group block border border-[var(--line)] bg-[rgba(250,248,243,0.58)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--paper-strong)]"><p className="section-label">{label}</p><h2 className="mt-3 text-lg font-semibold text-[var(--text)]">{title}</h2><p className="mt-2 text-sm leading-6 text-[var(--secondary)]">{text}</p><span className="mt-5 inline-block text-xs font-semibold text-[var(--accent-dark)] transition group-hover:translate-x-1">查看入口 →</span></Link>;
}
