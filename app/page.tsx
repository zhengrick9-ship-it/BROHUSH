import Link from "next/link";
import portfolio from "@/content/portfolio/2026-08-21.json";
import plan from "@/content/plans/2026-08-21.json";
import trades from "@/content/trades/2026-08-21.json";
import { ResearchShell } from "@/app/components/ResearchShell";

const entryCards = [
  ["01 / INDUSTRY", "/themes", "板块地图", "从大产业判断景气、政策、资金和未来方向。"],
  ["02 / MODULE", "/modules", "价值模块", "把产业拆成可跟踪的价值模块与价值迁移。"],
  ["03 / TOPIC", "/topics", "专题研究", "围绕技术路线、供需、客户验证、催化与风险形成专题。"],
  ["04 / EQUITY", "/stocks", "个股档案", "记录业务、产业位置、估值、走势和持有/退出条件。"],
  ["05 / REPORT", "/reports", "研究报告", "按日期沉淀周末复盘、专题报告和市场分析。"],
  ["06 / PLAN", "/plans", "作战计划", "按日期查看盘前计划、盘中动作、收盘复盘和偏差。"],
  ["07 / PORTFOLIO", "/portfolio", "持仓看板", "查看最新持仓、成本、逻辑、风险和组合演变。"],
  ["08 / TRADES", "/trades", "交易明细", "回看成交、换仓理由、当时依据和结果复盘。"],
];

function money(value: number) { return value.toLocaleString("zh-CN", { maximumFractionDigits: 0 }); }

export default function HomePage() {
  const positions = portfolio.accounts.flatMap((account) => account.positions);
  const marketValue = positions.reduce((sum, item) => sum + item.marketValue, 0);
  const pnl = positions.reduce((sum, item) => sum + item.pnl, 0);
  const top = [...positions].sort((a, b) => b.marketValue - a.marketValue).slice(0, 4);
  return <ResearchShell eyebrow="YOLO / 总览" title="今日工作台" description="">
    <section className="dashboard-banner"><div><p className="section-label">当前状态</p><h2>周频决策，盘中只查触发。</h2><p>快照：{portfolio.asOf.slice(0, 16).replace("T", " ")} · 参考价</p></div><Link href="/plans/2026-08-21" className="primary-button">今日计划</Link></section>
    <section className="metric-grid metric-grid-wide">
      <div className="metric"><p className="section-label">已列示市值</p><p className="mt-3 text-2xl font-semibold">¥{money(marketValue)}</p><p className="mt-2 text-xs text-[var(--muted)]">两组账户快照合计</p></div>
      <div className="metric"><p className="section-label">参考浮盈亏</p><p className={`mt-3 text-2xl font-semibold ${pnl >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>{pnl >= 0 ? "+" : "-"}¥{money(Math.abs(pnl))}</p><p className="mt-2 text-xs text-[var(--muted)]">按截图参考价</p></div>
      <div className="metric"><p className="section-label">当前持仓</p><p className="mt-3 text-2xl font-semibold">{positions.length}</p><p className="mt-2 text-xs text-[var(--muted)]">跨两个账户分组</p></div>
      <div className="metric"><p className="section-label">交易事件</p><p className="mt-3 text-2xl font-semibold">{trades.events.length}</p><p className="mt-2 text-xs text-[var(--muted)]">已确认事件节选</p></div>
      <div className="metric"><p className="section-label">策略节奏</p><p className="mt-3 text-2xl font-semibold text-[var(--accent-dark)]">周频</p><p className="mt-2 text-xs text-[var(--muted)]">盘中只查预案</p></div>
    </section>
    <section className="dashboard-columns">
      <div className="dashboard-panel"><div className="panel-heading"><div><p className="section-label">交易库 / PORTFOLIO</p><h2>持仓速览</h2></div><Link href="/portfolio">全部持仓 →</Link></div><div className="position-list">{top.map((item) => <div className="position-line" key={item.code}><div><strong>{item.name}</strong><small>{item.code} · {item.shares} 股</small></div><b>¥{money(item.marketValue)}</b><span className={item.pnl >= 0 ? "positive" : "negative"}>{item.pnl >= 0 ? "+" : "-"}¥{money(Math.abs(item.pnl))}</span></div>)}</div><p className="panel-note">完整成本、参考价、持有逻辑与账户分组见持仓页面。</p></div>
      <div className="dashboard-panel"><div className="panel-heading"><div><p className="section-label">交易库 / TODAY</p><h2>{plan.title}</h2></div><Link href="/plans/2026-08-21">打开 →</Link></div><p className="stance-chip">{plan.stance}</p><ul className="compact-list">{plan.actionCards.slice(0, 3).map((card) => <li key={card.title}><b>{card.title}</b><span>{card.reason}</span></li>)}</ul></div>
    </section>
    <section className="library-section"><div className="panel-heading"><div><p className="section-label">三库导航</p><h2>把研究、执行和规则分开。</h2></div><p>每个库独立沉淀，但用板块、模块、专题、个股和交易关联。</p></div><div className="library-grid">{entryCards.map(([label, href, title, text]) => <Link key={href} href={href} className="library-card"><span>{label}</span><h3>{title}</h3><p>{text}</p><i>进入 →</i></Link>)}</div></section>
  </ResearchShell>;
}
