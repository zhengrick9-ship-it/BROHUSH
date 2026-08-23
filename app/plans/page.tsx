import Link from "next/link";
import { ResearchShell } from "@/app/components/ResearchShell";
import plan from "@/content/plans/2026-08-21.json";
import planManifest from "@/content/plans/index.json";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const plans = [...planManifest.plans].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const latestPlan = plans.find((item) => item.id === planManifest.latest) ?? plans[0];
  const latestSummary = plan.actionCards.slice(0, 3).map((card) => card.title).join(" · ");
  return (
    <ResearchShell eyebrow="BATTLE PLANS / DAILY ARCHIVE" title="每天的计划，都留下当时的依据。" description="盘前形成假设，盘中只检查预定条件，收盘再对照实际结果。数据状态和证据时点始终跟着计划走。">
      <section className="metric-grid metric-grid-wide">
        <div className="metric"><p className="section-label">最新日期</p><p className="mt-3 text-2xl font-semibold">{plan.date}</p><p className="mt-2 text-xs text-[var(--muted)]">盘前版</p></div>
        <div className="metric"><p className="section-label">状态</p><p className="mt-3 text-2xl font-semibold text-[var(--accent-dark)]">部分数据</p><p className="mt-2 text-xs text-[var(--muted)]">今日QMT快照待落盘</p></div>
        <div className="metric"><p className="section-label">执行框架</p><p className="mt-3 text-2xl font-semibold">周频优先</p><p className="mt-2 text-xs text-[var(--muted)]">盘中只查触发</p></div>
      </section>
      <section className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="dashboard-panel"><p className="section-label">最新版本关键摘要 · {latestPlan.versionLabel}</p><h2 className="mt-3 text-xl font-semibold">{plan.title}</h2><p className="mt-3 text-sm leading-7 text-[var(--secondary)]">{plan.stance}</p><p className="mt-3 text-xs leading-6 text-[var(--muted)]">核心动作：{latestSummary}</p><p className="mt-3 text-xs text-[var(--muted)]">数据状态：{plan.dataStatus} · 更新时间：{plan.updatedAt}</p><Link href={latestPlan.route} className="mt-5 inline-block text-xs font-semibold text-[var(--accent-dark)]">打开最新计划 →</Link></div>
        <div className="dashboard-panel"><div className="panel-heading"><div><p className="section-label">版本归档</p><h2>作战计划时间线</h2></div><p>新 → 旧</p></div><div className="mt-4 grid gap-3">{plans.map((item) => <Link href={item.route} key={item.id} className="block border-t border-[var(--line)] pt-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{item.date} · {item.version}</p><p className="mt-1 text-xs text-[var(--muted)]">更新时间 {item.updatedAt}</p></div>{item.id === planManifest.latest && <span className="text-xs font-semibold text-[var(--accent-dark)]">最新</span>}</div><p className="mt-2 text-xs leading-6 text-[var(--secondary)]">{item.stance}</p></Link>)}</div></div>
      </section>
      <section className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="border border-dashed border-[var(--line-strong)] p-5"><p className="section-label">收盘复盘</p><h2 className="mt-3 text-xl font-semibold">{plan.date} / REVIEW</h2><p className="mt-3 text-sm leading-7 text-[var(--secondary)]">收盘后记录实际涨跌、执行结果、偏差和下一交易日修正。</p><p className="mt-5 text-xs text-[var(--muted)]">当前状态：待收盘</p></div>
      </section>
    </ResearchShell>
  );
}
