import Link from "next/link";
import { ResearchShell } from "@/app/components/ResearchShell";

const strategies = [
  { name: "周频主策略", state: "当前主用", color: "green", rhythm: "周末制定 / 盘中只查触发", rule: "先判断板块趋势与产业逻辑，再在专题中选择具备业务验证和位置优势的个股。", exit: "逻辑失效、板块趋势破坏，或预设的量价退出条件成立。" },
  { name: "低位双维", state: "候选筛选", color: "blue", rhythm: "周末运行 / 结果人工复核", rule: "同时从个股低位形态和板块/主题共振两个维度筛选，输出个股排序、主题排序与共振加分后的个股。", exit: "数据质量不足时不触发；不把名单当成自动买单。" },
  { name: "价值链爆发", state: "研究策略", color: "orange", rhythm: "专题更新", rule: "从板块、专题到个股，寻找未来价值迁移中尚未充分定价、具备真实技术或业务壁垒的价值点。", exit: "客户验证、订单兑现、技术路线或现金流证据不支持预期。" },
  { name: "条件触发", state: "盘中执行层", color: "red", rhythm: "只看预设情景", rule: "以VWAP、关键支撑、板块相对强度、持续窗口和成交量确认计划内动作，减少盘中临时起意。", exit: "行情或证据不连续时不操作；不自动下单、撤单或改价。" },
];

export default function StrategiesPage() {
  return <ResearchShell eyebrow="STRATEGY LIBRARY / RULES" title="策略库" description="交易机制与策略输出分开保存；每个运行版本独立留存。">
    <section className="strategy-callout"><div><p className="section-label">最新策略组</p><h2>温度计机制 + 低位金叉窗口四策略</h2><p>温度计机制先决定市场允许的风险预算和策略范围；四套低位金叉策略相互独立，日常选择其中一套运行，同时运行只用于回测比较和归因。</p></div><div className="strategy-badges"><span>独立运行</span><span>不自动下单</span></div></section>
    <div className="mb-5 grid gap-3 md:grid-cols-2"><Link href="/strategies/mechanisms" className="block rounded-xl border border-[var(--accent)] bg-[var(--paper-strong)] p-5 transition hover:-translate-y-0.5"><p className="section-label">交易机制</p><div className="mt-2 flex items-center justify-between gap-4"><h2 className="text-lg font-semibold">源代码、说明与回测</h2><span className="text-xs font-semibold text-[var(--accent-dark)]">进入 →</span></div><p className="mt-2 text-sm leading-6 text-[var(--secondary)]">查看温度计机制与 L0–L3 的目标、硬条件、代码和历史表现。</p></Link><Link href="/strategies/outputs/20260831T224529-low-cross-window-v1" className="block rounded-xl border border-[var(--accent)] bg-[var(--paper-strong)] p-5 transition hover:-translate-y-0.5"><p className="section-label">策略输出</p><div className="mt-2 flex items-center justify-between gap-4"><h2 className="text-lg font-semibold">2026-08-31 最新结果</h2><span className="text-xs font-semibold text-[var(--accent-dark)]">打开 →</span></div><p className="mt-2 text-sm leading-6 text-[var(--secondary)]">四套策略的候选、人工复核、推荐理由和回测对比。</p></Link></div>
    <section className="library-section strategy-layer-section"><div className="panel-heading"><div><p className="section-label">策略库 / 机制层</p><h2>交易机制</h2></div><p>先看规则，再看运行结果</p></div><div className="strategy-grid">{strategies.map((strategy, index) => <article id={["weekly-main", "dual-low", "value-chain", "condition-triggers"][index]} className={`strategy-card strategy-${strategy.color}`} key={strategy.name}><div className="strategy-card-head"><div><p className="section-label">{strategy.state}</p><h2>{strategy.name}</h2></div><span>{strategy.rhythm}</span></div><div className="strategy-body"><p><b>核心规则</b>{strategy.rule}</p><p><b>失效/退出</b>{strategy.exit}</p></div></article>)}</div></section>
    <section className="workspace-note"><p className="section-label">使用方式</p><p>周末：运行筛选、复盘市场、更新板块与专题研究；中午/晚上：只核对是否触发；交易后：记录事实、理由和结果。策略输出必须经过研究证据与数据状态检查。</p></section>
  </ResearchShell>;
}
