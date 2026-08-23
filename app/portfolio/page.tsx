import Link from "next/link";
import { ResearchShell } from "@/app/components/ResearchShell";
import portfolio from "@/content/portfolio/2026-08-23.json";
import { requirePrivateSession } from "@/lib/auth/private";

export const dynamic = "force-dynamic";

function money(value: number | null) { return value === null ? "—" : value.toLocaleString("zh-CN", { maximumFractionDigits: 2 }); }

export default async function PortfolioPage() {
  await requirePrivateSession("/portfolio");
  const all = portfolio.accounts.flatMap((account) => account.positions);
  const marketValue = all.reduce((sum, item) => sum + item.marketValue, 0);
  const pnl = all.reduce((sum, item) => sum + item.pnl, 0);
  return <ResearchShell eyebrow="PORTFOLIO / CURRENT SNAPSHOT" title="我现在持有什么，为什么持有。" description="组合页面按账户分组保存最新确认快照，展示成本、参考价、仓位角色和盈亏；不同账户不会被未经确认地合并。">
    <div className="mt-4 border border-[var(--line)] bg-[var(--paper-strong)] p-4 text-xs leading-6 text-[var(--secondary)]"><b>快照时点：</b>{portfolio.asOf} · <b>状态：</b>{portfolio.status} · <b>来源：</b>{portfolio.source}。当前网站尚未接入券商实时 API，参考价不是实时行情。</div>
    <section className="metric-grid metric-grid-wide mt-8">
      <div className="metric"><p className="section-label">已列示市值</p><p className="mt-3 text-2xl font-semibold">{money(marketValue)}</p></div>
      <div className="metric"><p className="section-label">参考浮动盈亏</p><p className={`mt-3 text-2xl font-semibold ${pnl >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>{pnl >= 0 ? "+" : ""}{money(pnl)}</p></div>
      <div className="metric"><p className="section-label">账户</p><p className="mt-3 text-2xl font-semibold">{portfolio.accounts.length}</p><p className="mt-2 text-xs text-[var(--muted)]">分组展示</p></div>
    </section>
    <section className="mt-10 space-y-10">{portfolio.accounts.map((account) => <div key={account.name}><div className="advice-header"><div><p className="section-label">ACCOUNT</p><h2 className="mt-2 text-2xl font-semibold">{account.name}</h2></div><p className="text-xs text-[var(--muted)]">现金 {money(account.cash)}</p></div><div className="mt-4 overflow-x-auto border border-[var(--line)]"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-[rgba(221,214,200,0.35)] text-xs text-[var(--muted)]"><tr><th className="px-4 py-3">标的</th><th className="px-4 py-3">持仓</th><th className="px-4 py-3">可用</th><th className="px-4 py-3">成本</th><th className="px-4 py-3">参考价</th><th className="px-4 py-3">市值</th><th className="px-4 py-3">盈亏</th><th className="px-4 py-3">盈亏率</th></tr></thead><tbody>{account.positions.map((item) => <tr key={item.code} className="border-t border-[var(--line)]"><td className="px-4 py-3 font-semibold">{item.name}<span className="ml-2 text-xs font-normal text-[var(--muted)]">{item.code}</span></td><td className="px-4 py-3">{item.shares}</td><td className="px-4 py-3">{item.availableShares ?? item.shares}</td><td className="px-4 py-3">{item.cost.toFixed(4)}</td><td className="px-4 py-3">{item.referencePrice.toFixed(2)}</td><td className="px-4 py-3">{money(item.marketValue)}</td><td className={`px-4 py-3 font-semibold ${item.pnl >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>{item.pnl >= 0 ? "+" : ""}{money(item.pnl)}</td><td className={`px-4 py-3 ${item.pnlPct >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>{item.pnlPct.toFixed(2)}%</td></tr>)}</tbody></table></div></div>)}</section>
    <section className="mt-12"><div className="advice-header"><div><p className="section-label">EVOLUTION</p><h2 className="mt-2 text-2xl font-semibold">组合演变</h2></div><Link href="/trades" className="text-xs font-semibold text-[var(--accent-dark)]">查看交易轨迹 →</Link></div><div className="mt-5 grid gap-3 md:grid-cols-3"><div className="border border-[var(--line)] p-5"><p className="section-label">阶段 1</p><p className="mt-3 font-semibold">从分散持仓进入收缩</p><p className="mt-2 text-sm leading-6 text-[var(--secondary)]">以减少低弹性、低确定性仓位为目标，保留主线与防守方向。</p></div><div className="border border-[var(--line)] p-5"><p className="section-label">阶段 2</p><p className="mt-3 font-semibold">主题换仓</p><p className="mt-2 text-sm leading-6 text-[var(--secondary)]">扬杰科技换入中恒电气，体现算力电源方向的进攻尝试；后续必须用业务兑现校验。</p></div><div className="border border-[var(--line)] p-5"><p className="section-label">阶段 3</p><p className="mt-3 font-semibold">当前组合</p><p className="mt-3 text-sm leading-6 text-[var(--secondary)]">科技、医药、资源、防守并存，下一步从“看名称”转向“看逻辑是否仍成立”。</p></div></div></section>
  </ResearchShell>;
}
