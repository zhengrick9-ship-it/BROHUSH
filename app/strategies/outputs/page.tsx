import output from "@/content/strategy-outputs/20260821T123020-dual-low-v1.3-ex-st-bj.json";
import strategyManifest from "@/content/strategy-outputs/index.json";
import { ResearchShell } from "@/app/components/ResearchShell";

const pct = (value: number | null) => value === null ? "—" : `${value.toFixed(2)}%`;
const ratio = (value: number) => `${(value * 100).toFixed(0)}%`;
const reviewLabel: Record<string, string> = { NONE: "无标记", HIGH_PE_REVIEW: "高PE复核", VALUATION_DATA_MISSING: "估值缺失" };

function ScoreBar({ value }: { value: number }) {
  return <span className="inline-flex h-1.5 w-20 overflow-hidden rounded-full bg-[var(--line)]"><i className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(100, value)}%` }} /></span>;
}

export default function StrategyOutputsPage() {
  const latestRun = strategyManifest.runs.find((run) => run.id === strategyManifest.latest) ?? strategyManifest.runs[0];
  const latestSummary = `低位启动 ${output.stageCounts.LOW_ACTIVATING} 只，低位反转准备 ${output.stageCounts.LOW_REVERSAL_PREP} 只；纯个股前三：${output.stocks.slice(0, 3).map((item) => item.name).join("、")}；共振前三：${output.resonance.slice(0, 3).map((item) => item.name).join("、")}。`;
  return <ResearchShell eyebrow="STRATEGY LIBRARY / OUTPUTS" title="低位策略输出" description="按运行批次发布策略结果，保留个股低位、行业共振、主题共振和人工复核边界。">
    <section className="strategy-callout"><div><p className="section-label">最新版本 · {output.versionLabel}</p><h2>统一低位双维策略 v1.2-live</h2><p>这次是按 QDH 最新接受版重新运行的结果，不是历史名单复制。榜单用于周频研究和候选比较，不直接代替买入判断。</p><p className="mt-3 text-xs text-[var(--muted)]">版本号：{output.versionId} · 数据截至：{output.asOf}</p></div><div className="strategy-badges"><span>最新</span><span>QDH PASS</span><span>人工复核</span><span>不自动交易</span></div></section>

    <section className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="dashboard-panel"><p className="section-label">最新版本关键摘要</p><p className="mt-3 text-sm leading-7 text-[var(--secondary)]">{latestSummary}</p><p className="mt-3 text-xs text-[var(--muted)]">运行：{output.runAt} · QDH：{output.releaseId} · 状态：{output.status}</p></div>
      <div className="dashboard-panel"><div className="panel-heading"><div><p className="section-label">版本归档</p><h2>策略输出时间线</h2></div><p>新 → 旧</p></div><div className="mt-4 grid gap-3">{[...strategyManifest.runs].sort((a, b) => b.runAt.localeCompare(a.runAt)).map((run) => <a href={run.route} key={run.id} className="block border-t border-[var(--line)] pt-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{run.versionLabel}</p><p className="mt-1 text-xs text-[var(--muted)]">数据截至 {run.asOf} · {run.releaseId}</p></div>{run.id === strategyManifest.latest && <span className="text-xs font-semibold text-[var(--accent-dark)]">最新</span>}</div><p className="mt-2 text-xs leading-6 text-[var(--secondary)]">{run.summary}</p></a>)}</div></div>
    </section>

    <section className="mt-4 workspace-note"><p className="section-label">本轮科技 / 医药缺席归因</p><p className="mt-2 text-sm leading-7 text-[var(--secondary)]">{output.sectorDiagnostics.technologyReason}</p><p className="mt-2 text-sm leading-7 text-[var(--secondary)]">{output.sectorDiagnostics.medicalReason}</p><p className="mt-3 text-xs text-[var(--muted)]">科技候选 {output.sectorDiagnostics.technologyCandidates} 只，医药候选 {output.sectorDiagnostics.medicalCandidates} 只；最高科技候选：{output.sectorDiagnostics.topTechnology}；最高医药候选：{output.sectorDiagnostics.topMedical}。</p></section>

    <section className="metric-grid metric-grid-wide">
      <div className="metric"><p className="section-label">数据截至</p><p className="mt-3 text-xl font-semibold">{output.asOf}</p><p className="mt-2 text-xs text-[var(--muted)]">QDH accepted release</p></div>
      <div className="metric"><p className="section-label">全A底表</p><p className="mt-3 text-xl font-semibold">{output.universe.toLocaleString()}</p><p className="mt-2 text-xs text-[var(--muted)]">含数据待复核</p></div>
      <div className="metric"><p className="section-label">机械候选</p><p className="mt-3 text-xl font-semibold">{output.mechanicalHits}</p><p className="mt-2 text-xs text-[var(--muted)]">达到启动/准备门</p></div>
      <div className="metric"><p className="section-label">行业共振</p><p className="mt-3 text-xl font-semibold">{output.industryGates}</p><p className="mt-2 text-xs text-[var(--muted)]">申万二级</p></div>
      <div className="metric"><p className="section-label">主题共振</p><p className="mt-3 text-xl font-semibold">{output.themeGates}</p><p className="mt-2 text-xs text-[var(--muted)]">研究映射层</p></div>
    </section>

    <section className="workspace-note"><p className="section-label">数据与使用边界</p><p className="mt-2 text-sm leading-7 text-[var(--secondary)]">{output.dataNote} {output.useBoundary}</p><p className="mt-2 text-xs text-[var(--muted)]">运行时间：{output.runAt} · release_id：{output.releaseId}</p></section>

    <section className="mt-8 grid gap-4 lg:grid-cols-2">
      <div className="dashboard-panel"><div className="panel-heading"><div><p className="section-label">01 / 个股排序</p><h2>纯个股低位榜</h2></div><p>位置、MACD、资金与反热度共同排序</p></div><div className="mt-4 grid gap-2">{output.stocks.map((item) => <div className="border-t border-[var(--line)] pt-3" key={item.code}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{item.rank}. {item.name} <span className="font-normal text-[var(--muted)]">{item.code}</span></p><p className="mt-1 text-xs text-[var(--secondary)]">{item.industry} · {item.state} · MACD {item.macd}</p></div><div className="text-right"><p className="text-sm font-semibold">{item.score.toFixed(2)}</p><ScoreBar value={item.score} /></div></div><p className="mt-2 text-xs text-[var(--muted)]">60日位置 {pct(item.pos60)} · 20日涨跌 {pct(item.r20)} · 20日均额 {Math.round(item.amount20).toLocaleString()}千元 · 复核：{reviewLabel[item.review]}</p></div>)}</div></div>
      <div className="dashboard-panel"><div className="panel-heading"><div><p className="section-label">02 / 共振排序</p><h2>行业 + 主题加分榜</h2></div><p>只作研究优先级，不等于基本面确认</p></div><div className="mt-4 grid gap-2">{output.resonance.map((item) => <div className="border-t border-[var(--line)] pt-3" key={item.code}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{item.rank}. {item.name} <span className="font-normal text-[var(--muted)]">{item.code}</span></p><p className="mt-1 text-xs text-[var(--secondary)]">{item.industry} · {item.theme} · {item.macd}</p></div><div className="text-right"><p className="text-sm font-semibold">{item.score.toFixed(2)}</p><ScoreBar value={item.score} /></div></div><p className="mt-2 text-xs text-[var(--muted)]">纯个股 {item.stockScore.toFixed(2)} · 60日位置 {pct(item.pos60)} · 20日涨跌 {pct(item.r20)} · 复核：{reviewLabel[item.review]}</p></div>)}</div></div>
    </section>

    <section className="mt-8 dashboard-panel"><div className="panel-heading"><div><p className="section-label">03 / 板块共振</p><h2>申万二级低位行业</h2></div><p>低位比例高，不代表已经启动；本轮整体激活度偏低</p></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead className="text-[var(--muted)]"><tr><th className="py-3 pr-4">排名</th><th className="py-3 pr-4">行业</th><th className="py-3 pr-4">评分</th><th className="py-3 pr-4">低位比例</th><th className="py-3 pr-4">中位位置</th><th className="py-3 pr-4">MACD有利比例</th><th className="py-3">正流比例</th></tr></thead><tbody>{output.industries.map((item) => <tr className="border-t border-[var(--line)]" key={item.name}><td className="py-3 pr-4">{item.rank}</td><td className="py-3 pr-4 font-semibold">{item.name}</td><td className="py-3 pr-4">{item.score.toFixed(2)}</td><td className="py-3 pr-4">{ratio(item.lowRatio)}</td><td className="py-3 pr-4">{pct(item.medianPos60)}</td><td className="py-3 pr-4">{ratio(item.macdRatio)}</td><td className="py-3">{ratio(item.flowRatio)}</td></tr>)}</tbody></table></div></section>

    <section className="mt-4 dashboard-panel"><div className="panel-heading"><div><p className="section-label">04 / 主题研究映射</p><h2>同花顺主题低位榜</h2></div><p>映射截至 {output.mappingAsOf}，需人工核对主营相关性</p></div><div className="mt-4 grid gap-2 md:grid-cols-2">{output.themes.map((item) => <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3" key={item.name}><div><p className="text-sm font-semibold">{item.rank}. {item.name}</p><p className="mt-1 text-xs text-[var(--muted)]">低位 {ratio(item.lowRatio)} · 中位位置 {pct(item.medianPos60)} · 正流 {ratio(item.flowRatio)}</p></div><p className="text-sm font-semibold">{item.score.toFixed(2)}</p></div>)}</div></section>

    <section className="mt-4 workspace-note"><p className="section-label">如何使用这次输出</p><p className="mt-2 text-sm leading-7 text-[var(--secondary)]">优先看“刚金叉/近三日金叉”与行业、主题同时共振的名字，再做主营、财务、公告、估值和当前行情复核。中国卫通、航天电子等虽然共振排名靠前，但已有高PE复核标记；瑞贝卡、600636等存在估值或名称映射问题，不能因为分数高直接采用。低位不是理由本身，低位 + 真实业务 + 可信催化 + 当前量价确认才进入交易计划。</p></section>
  </ResearchShell>;
}
