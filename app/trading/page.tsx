import Link from "next/link";
import { ResearchShell } from "@/app/components/ResearchShell";

export const dynamic = "force-dynamic";

export default async function TradingHomePage() {
  const entries = [
    { group: "组合", items: [["持仓", "/portfolio", "当前组合、成本、市值、持有逻辑和退出条件"], ["交易明细", "/trades", "成交事实、换仓原因、结果与组合演变"]] },
    { group: "计划与复盘", items: [["作战计划", "/plans", "按日期保存盘前计划、盘中动作和收盘复盘"], ["市场复盘", "/market", "指数、成交、板块轮动和事件影响"]] },
  ];
  return <ResearchShell eyebrow="TRADING LIBRARY" title="交易库" description="组合、交易、作战计划和市场复盘分别保存，按日期与版本进入。">
    <section className="private-library-banner"><div><p className="section-label">TRADING WORKSPACE</p><h2>组合与交易，单独保存。</h2><p>研究库负责回答机会在哪里；交易库负责记录我持有什么、为什么调整以及结果如何。</p></div></section>
    <div className="trading-library-sections">{entries.map((entry) => <section className="library-section" key={entry.group}><div className="panel-heading"><div><p className="section-label">交易库 / 层级</p><h2>{entry.group}</h2></div><p>进入下一层查看具体内容</p></div><div className="library-grid trading-entry-grid">{entry.items.map(([label, href, text]) => <Link className="library-card" href={href} key={href}><span>交易库 / {entry.group} / {label}</span><h3>{label}</h3><p>{text}</p><i>进入 →</i></Link>)}</div></section>)}</div>
  </ResearchShell>;
}
