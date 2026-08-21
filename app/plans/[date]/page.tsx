import Link from "next/link";
import { ResearchShell } from "@/app/components/ResearchShell";
import plan from "@/content/plans/2026-08-21.json";

export function generateStaticParams() { return [{ date: "2026-08-21" }]; }

export default async function PlanDetailPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (date !== plan.date) return null;
  return (
    <ResearchShell eyebrow={`${plan.date} / PREMARKET PLAN`} title={plan.title} description={plan.stance}>
      <div className="mt-4 border border-[var(--line)] bg-[var(--paper-strong)] p-4 text-xs leading-6 text-[var(--secondary)]"><b>数据状态：</b>{plan.dataStatus}。{plan.dataNote}</div>
      <section className="mt-10"><div className="advice-header"><div><p className="section-label">盘前热点</p><h2 className="mt-2 text-2xl font-semibold">热点只做假设，不直接等于买单。</h2></div></div><div className="mt-5 grid gap-3 md:grid-cols-2">{plan.hotspots.map((hotspot) => <article key={hotspot.name} className="border border-[var(--line)] bg-[rgba(250,248,243,0.58)] p-5"><p className="section-label">{hotspot.name}</p><p className="mt-3 text-sm leading-7 text-[var(--secondary)]">{hotspot.view}</p><p className="mt-3 border-l-2 border-[var(--accent)] pl-3 text-xs leading-6 text-[var(--text)]">{hotspot.action}</p></article>)}</div></section>
      <section className="mt-12"><p className="section-label">行动卡片</p><div className="mt-5 grid gap-3">{plan.actionCards.map((card) => <article key={card.title} className="border border-[var(--line)] bg-[rgba(250,248,243,0.58)] p-5"><div className="flex flex-wrap items-baseline justify-between gap-3"><h2 className="text-lg font-semibold">{card.title}</h2><span className="section-label">{card.level}</span></div><p className="mt-3 text-sm leading-7 text-[var(--secondary)]">{card.reason}</p><p className="mt-3 text-xs leading-6"><b>触发：</b>{card.trigger}</p><p className="mt-2 text-xs leading-6 text-[var(--muted)]"><b>失效：</b>{card.invalid}</p></article>)}</div></section>
      <section className="mt-12"><div className="advice-header"><div><p className="section-label">组合联动</p><h2 className="mt-2 text-2xl font-semibold">最新持仓快照</h2></div><Link href="/portfolio" className="text-xs font-semibold text-[var(--accent-dark)]">查看组合 →</Link></div><div className="mt-5 grid gap-3 md:grid-cols-2">{plan.holdingsSnapshot.items.map((item) => <article key={`${item.account}-${item.code}`} className="border border-[var(--line)] bg-[rgba(250,248,243,0.58)] p-4"><div className="flex items-baseline justify-between gap-3"><h3 className="font-semibold">{item.name}</h3><span className="text-xs text-[var(--muted)]">{item.code}</span></div><p className="mt-2 text-xs text-[var(--muted)]">{item.account} · {item.shares}股 · 参考价 {item.referencePrice}</p><p className={`mt-3 text-lg font-semibold ${item.pnl >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>{item.pnl >= 0 ? "+" : ""}{item.pnl.toLocaleString()} <span className="text-xs">({item.pnlPct}%)</span></p><p className="mt-2 text-xs text-[var(--secondary)]">角色：{item.role}</p></article>)}</div></section>
    </ResearchShell>
  );
}
