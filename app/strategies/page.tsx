import Link from "next/link";
import { ResearchShell } from "@/app/components/ResearchShell";

const strategies = [
  { name: "周频主策略", state: "当前主用", color: "green", rhythm: "周末制定 / 盘中只查触发", rule: "先判断板块趋势与产业逻辑，再在专题中选择具备业务验证和位置优势的个股。", exit: "逻辑失效、板块趋势破坏，或预设的量价退出条件成立。" },
  { name: "低位双维", state: "候选筛选", color: "blue", rhythm: "周末运行 / 结果人工复核", rule: "同时从个股低位形态和板块/主题共振两个维度筛选，输出个股排序、主题排序与共振加分后的个股。", exit: "数据质量不足时不触发；不把名单当成自动买单。" },
  { name: "价值链爆发", state: "研究策略", color: "orange", rhythm: "专题更新", rule: "从板块、专题到个股，寻找未来价值迁移中尚未充分定价、具备真实技术或业务壁垒的价值点。", exit: "客户验证、订单兑现、技术路线或现金流证据不支持预期。" },
  { name: "条件触发", state: "盘中执行层", color: "red", rhythm: "只看预设情景", rule: "以VWAP、关键支撑、板块相对强度、持续窗口和成交量确认计划内动作，减少盘中临时起意。", exit: "行情或证据不连续时不操作；不自动下单、撤单或改价。" },
];

export default function StrategiesPage() {
  return <ResearchShell eyebrow="STRATEGY LIBRARY / RULES" title="把判断写成可重复执行的规则。" description="策略库不是推荐名单，而是研究如何进入交易、何时退出以及何时明确不操作的规则层。">
    <section className="strategy-callout"><div><p className="section-label">总原则</p><h2>研究先于交易，证据先于动作。</h2><p>周末完成大部分判断；盘中只检查预设条件。若数据不新、逻辑不清或候选优势不足，现金与不操作都是有效结果。</p></div><div className="strategy-badges"><span>不自动下单</span><span>保留反证</span></div></section>
    <Link href="/strategies/outputs" className="mb-5 block rounded-xl border border-[var(--accent)] bg-[var(--paper-strong)] p-5 transition hover:-translate-y-0.5"><p className="section-label">STRATEGY OUTPUTS</p><div className="mt-2 flex items-center justify-between gap-4"><h2 className="text-lg font-semibold">查看最新低位策略结果</h2><span className="text-xs font-semibold text-[var(--accent-dark)]">打开输出 →</span></div><p className="mt-2 text-sm leading-6 text-[var(--secondary)]">发布个股排序、行业/主题共振和共振加分后的研究候选；每次运行保留 QDH 版本与数据截至日。</p></Link>
    <section className="library-section strategy-layer-section"><div className="panel-heading"><div><p className="section-label">策略库 / 机制层</p><h2>交易机制</h2></div><p>先看规则，再看运行结果</p></div><div className="strategy-grid">{strategies.map((strategy, index) => <article id={["weekly-main", "dual-low", "value-chain", "condition-triggers"][index]} className={`strategy-card strategy-${strategy.color}`} key={strategy.name}><div className="strategy-card-head"><div><p className="section-label">{strategy.state}</p><h2>{strategy.name}</h2></div><span>{strategy.rhythm}</span></div><div className="strategy-body"><p><b>核心规则</b>{strategy.rule}</p><p><b>失效/退出</b>{strategy.exit}</p></div></article>)}</div></section>
    <section className="workspace-note"><p className="section-label">使用方式</p><p>周末：运行筛选、复盘市场、更新板块与专题研究；中午/晚上：只核对是否触发；交易后：记录事实、理由和结果。策略输出必须经过研究证据与数据状态检查。</p></section>
  </ResearchShell>;
}
