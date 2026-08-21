import Link from "next/link";
import { ResearchShell } from "@/app/components/ResearchShell";
import plan from "@/content/plans/2026-08-21.json";

export default function PlansPage() {
  return (
    <ResearchShell eyebrow="BATTLE PLANS / DAILY ARCHIVE" title="每天的计划，都留下当时的依据。" description="盘前形成假设，盘中只检查预定条件，收盘再对照实际结果。数据状态和证据时点始终跟着计划走。">
      <section className="metric-grid metric-grid-wide">
        <div className="metric"><p className="section-label">最新日期</p><p className="mt-3 text-2xl font-semibold">{plan.date}</p><p className="mt-2 text-xs text-[var(--muted)]">盘前版</p></div>
        <div className="metric"><p className="section-label">状态</p><p className="mt-3 text-2xl font-semibold text-[var(--accent-dark)]">部分数据</p><p className="mt-2 text-xs text-[var(--muted)]">今日QMT快照待落盘</p></div>
        <div className="metric"><p className="section-label">执行框架</p><p className="mt-3 text-2xl font-semibold">周频优先</p><p className="mt-2 text-xs text-[var(--muted)]">盘中只查触发</p></div>
      </section>
      <section className="mt-10 grid gap-3 md:grid-cols-2">
        <Link href="/plans/2026-08-21" className="block border border-[var(--accent)] bg-[var(--paper-strong)] p-5"><p className="section-label">{plan.date} / PREMARKET</p><h2 className="mt-3 text-xl font-semibold">{plan.title}</h2><p className="mt-3 text-sm leading-7 text-[var(--secondary)]">{plan.stance}</p><span className="mt-5 inline-block text-xs font-semibold text-[var(--accent-dark)]">打开计划 →</span></Link>
        <div className="border border-dashed border-[var(--line-strong)] p-5"><p className="section-label">收盘复盘</p><h2 className="mt-3 text-xl font-semibold">{plan.date} / REVIEW</h2><p className="mt-3 text-sm leading-7 text-[var(--secondary)]">收盘后记录实际涨跌、执行结果、偏差和下一交易日修正。</p><p className="mt-5 text-xs text-[var(--muted)]">当前状态：待收盘</p></div>
      </section>
    </ResearchShell>
  );
}
