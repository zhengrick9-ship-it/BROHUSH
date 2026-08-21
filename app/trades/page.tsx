import { ResearchShell } from "@/app/components/ResearchShell";
import trades from "@/content/trades/2026-08-21.json";

export default function TradesPage() {
  return <ResearchShell eyebrow="TRADES / DECISION JOURNAL" title="每一笔交易，都能回到当时。" description="交易事实、当时理由和事后结果分开保存。当前先展示已确认的交易事件节选，完整券商流水导入后再扩展为逐笔审计。">
    <div className="mt-4 border border-[var(--line)] bg-[var(--paper-strong)] p-4 text-xs leading-6 text-[var(--secondary)]"><b>状态：</b>{trades.status}。{trades.note}</div>
    <section className="mt-10"><p className="section-label">DECISION TIMELINE</p><div className="mt-5 space-y-3">{trades.events.map((event) => <article key={`${event.date}-${event.name}-${event.side}`} className="border border-[var(--line)] bg-[rgba(250,248,243,0.58)] p-5"><div className="flex flex-wrap items-baseline justify-between gap-3"><div><span className="text-xs text-[var(--muted)]">{event.date}</span><h2 className="mt-2 text-lg font-semibold">{event.name}<span className="ml-2 text-xs font-normal text-[var(--muted)]">{event.code}</span></h2></div><span className={`outcome ${event.side === "买入" ? "outcome-h" : event.side === "卖出" ? "outcome-a" : "outcome-d"}`}>{event.side}</span></div><div className="mt-4 grid gap-2 text-sm leading-6 text-[var(--secondary)] md:grid-cols-3"><p><span className="text-xs text-[var(--muted)]">数量/价格</span><br />{event.shares ?? "—"} / {event.price ?? "—"}</p><p><span className="text-xs text-[var(--muted)]">当时理由</span><br />{event.reason}</p><p><span className="text-xs text-[var(--muted)]">结果/后续</span><br />{event.result}</p></div></article>)}</div></section>
    <section className="mt-12 border-t border-[var(--line-strong)] pt-8"><p className="section-label">记录边界</p><p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--secondary)]">网站不会把事后解释覆盖到原始成交上。接入完整流水后，会分别保存成交事实、下单时理由、关联板块/专题、持仓变化和事后复盘，并用时间线串起组合演变。</p></section>
  </ResearchShell>;
}
