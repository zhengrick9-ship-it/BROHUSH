import Link from "next/link";
import type { ReactNode } from "react";

const libraryGroups = [
  { label: "研究库", links: [{ href: "/themes", label: "板块" }, { href: "/modules", label: "模块" }, { href: "/topics", label: "专题" }, { href: "/stocks", label: "个股" }, { href: "/reports", label: "报告" }] },
  { label: "交易库", links: [{ href: "/portfolio", label: "持仓" }, { href: "/trades", label: "交易明细" }, { href: "/plans", label: "作战计划" }, { href: "/market", label: "市场复盘" }] },
  { label: "策略库", links: [{ href: "/strategies", label: "交易机制" }] },
];

export function ResearchShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return <div className="min-h-screen">
    <header className="site-header"><div className="mx-auto flex max-w-7xl items-center justify-between gap-7 px-5 py-3 lg:px-8">
      <Link href="/" className="brand-lockup text-[var(--text)]"><span className="brand-mark">Y</span><span><b>YOLO</b><small>个人投资工作台</small></span></Link>
      <nav className="workspace-nav" aria-label="主导航"><Link href="/" className="workspace-home">总览</Link>{libraryGroups.map((group) => <div className="nav-group" key={group.label}><span className="nav-group-label">{group.label}</span><div className="nav-group-links">{group.links.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}</div></div>)}</nav>
    </div></header>
    <main className="mx-auto w-full max-w-6xl px-6 pb-16"><section className="workspace-heading"><p className="section-label">{eyebrow}</p><div className="mt-3 max-w-4xl"><h1 className="text-2xl font-semibold leading-[1.2] tracking-[-0.03em] text-[var(--text)] md:text-3xl">{title}</h1></div></section>{children}</main>
  </div>;
}

export function EmptyState({ label = "内容正在接入" }: { label?: string }) {
  return <div className="border border-dashed border-[var(--line-strong)] bg-[rgba(250,248,243,0.5)] px-6 py-10"><p className="section-label">{label}</p><p className="mt-3 max-w-xl text-sm leading-7 text-[var(--secondary)]">当前内容仍在本地研究层维护。研究结果会先完成证据、时间和质量标记，再发布到这里。</p></div>;
}

export function LinkCard({ href, label, title, text }: { href: string; label: string; title: string; text: string }) {
  return <Link href={href} className="group block border border-[var(--line)] bg-[rgba(250,248,243,0.58)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--paper-strong)]"><p className="section-label">{label}</p><h2 className="mt-3 text-lg font-semibold text-[var(--text)]">{title}</h2><p className="mt-2 text-sm leading-6 text-[var(--secondary)]">{text}</p><span className="mt-5 inline-block text-xs font-semibold text-[var(--accent-dark)] transition group-hover:translate-x-1">查看入口 →</span></Link>;
}
