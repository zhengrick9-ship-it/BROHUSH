import { ResearchShell } from "@/app/components/ResearchShell";

type StrategyOutput = any;

const pct = (value: number | null | undefined) => value === null || value === undefined || Number.isNaN(value) ? "—" : `${Number(value).toFixed(2)}%`;
const ratio = (value: number | null | undefined) => value === null || value === undefined || Number.isNaN(value) ? "—" : `${(Number(value) * 100).toFixed(0)}%`;
const reviewLabel: Record<string, string> = { NONE: "无标记", HIGH_PE_REVIEW: "高PE复核", VALUATION_DATA_MISSING: "估值缺失", LOSS_OR_NONMEANINGFUL_PE: "亏损/PE无意义" };

function forbidden(item: any) {
  const code = String(item?.code ?? "").toUpperCase();
  const name = String(item?.name ?? "").replace(/\s/g, "").toUpperCase();
  return code.endsWith(".BJ") || /^(\*?ST|SST|S\*ST)/.test(name) || name.includes("退市") || name.startsWith("退") || name.endsWith("退");
}

function ScoreBar({ value }: { value: number }) {
  return <span className="inline-flex h-1.5 w-20 overflow-hidden rounded-full bg-[var(--line)]"><i className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(100, Number(value) || 0)}%` }} /></span>;
}

function StockLine({ item, output, index, watch = false }: { item: any; output: StrategyOutput; index: number; watch?: boolean }) {
  const href = `/strategies/outputs/${output.versionId}/stocks/${encodeURIComponent(item.code)}`;
  return <a href={href} className="block border-t border-[var(--line)] pt-3 transition hover:border-[var(--accent)]">
    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{index + 1}. {item.name} <span className="font-normal text-[var(--muted)]">{item.code}</span></p><p className="mt-1 text-xs text-[var(--secondary)]">{item.industry} · {watch ? "低位观察" : "严格候选"} · {item.state} · MACD {item.macd} · {item.macdQuality ?? "未评估"}</p></div><div className="text-right"><p className="text-sm font-semibold">{Number(item.score ?? 0).toFixed(2)}</p><ScoreBar value={Number(item.score ?? 0)} /></div></div>
    <p className="mt-2 text-xs text-[var(--muted)]">60日位置 {pct(item.pos60)} · 20日涨跌 {pct(item.r20)} · 20日均额 {Math.round(Number(item.amount20 ?? 0)).toLocaleString()}千元 · 复核：{reviewLabel[item.review] ?? item.review ?? "—"}</p>
  </a>;
}

export function StrategyOutputDetail({ output, isLatest, archived = false }: { output: StrategyOutput; isLatest: boolean; archived?: boolean }) {
  const stocks = (output.stocks ?? []).filter((item: any) => !forbidden(item));
  const watchStocks = (output.watchStocks ?? []).filter((item: any) => !forbidden(item));
  const resonance = (output.resonance ?? []).filter((item: any) => !forbidden(item));
  const analysis = output.analysis ?? {};
  const diagnostics = output.sectorDiagnostics ?? {};
  const industries = output.industries ?? [];
  const themes = output.themes ?? [];
  return <ResearchShell eyebrow="STRATEGY LIBRARY / OUTPUT DETAIL" title={`${output.strategy ?? "策略输出"} · ${output.version ?? ""}`} description="严格候选、低位观察、行业发现和主题发现分层呈现；每个对象都可进入详情。">
    <section className="strategy-callout"><div><p className="section-label">{isLatest ? "最新版本" : "历史版本"} · {output.versionLabel}</p><h2>{output.strategy ?? "统一低位双维策略"}</h2><p>{archived ? "这是历史版本，仅作复盘归档。" : analysis.conclusion ?? "本轮先筛低位，再筛MACD方向，最后观察行业与主题共振。"}</p><p className="mt-3 text-xs text-[var(--muted)]">版本号：{output.versionId} · 运行：{output.runAt} · 数据截至：{output.asOf} · QDH：{output.releaseId}</p></div><div className="strategy-badges"><span>{isLatest ? "最新" : "存档"}</span><span>{output.gate ?? "QDH"}</span><span>人工复核</span><span>不自动交易</span></div></section>

    <section className="metric-grid metric-grid-wide mt-4">
      <div className="metric"><p className="section-label">严格候选</p><p className="mt-3 text-xl font-semibold">{stocks.length}</p><p className="mt-2 text-xs text-[var(--muted)]">方向性MACD硬门</p></div>
      <div className="metric"><p className="section-label">低位观察池</p><p className="mt-3 text-xl font-semibold">{watchStocks.length}</p><p className="mt-2 text-xs text-[var(--muted)]">非买入清单</p></div>
      <div className="metric"><p className="section-label">低位启动</p><p className="mt-3 text-xl font-semibold">{output.stageCounts?.LOW_ACTIVATING ?? 0}</p><p className="mt-2 text-xs text-[var(--muted)]">刚金叉/近三日金叉</p></div>
      <div className="metric"><p className="section-label">行业发现</p><p className="mt-3 text-xl font-semibold">{industries.length}</p><p className="mt-2 text-xs text-[var(--muted)]">点击看成员</p></div>
      <div className="metric"><p className="section-label">主题发现</p><p className="mt-3 text-xl font-semibold">{themes.length}</p><p className="mt-2 text-xs text-[var(--muted)]">点击看成员</p></div>
    </section>

    <section className="mt-4 grid gap-4 lg:grid-cols-2"><div className="workspace-note"><p className="section-label">策略分析</p><p className="mt-2 text-sm leading-7 text-[var(--secondary)]">{analysis.macd ?? "MACD方向性与低位状态共同判断。"}</p><p className="mt-2 text-sm leading-7 text-[var(--secondary)]">{analysis.howToUse ?? "严格候选、观察池、行业/主题发现需要分层使用。"}</p></div><div className="workspace-note"><p className="section-label">边界与排除</p><p className="mt-2 text-sm leading-7 text-[var(--secondary)]">{output.dataNote}</p><p className="mt-2 text-xs text-[var(--muted)]">排除记录：{JSON.stringify(output.excludedByReason ?? {})} · 详情页再次过滤ST/退市/北交所</p></div></section>

    <section className="mt-8 grid gap-4 lg:grid-cols-2"><div className="dashboard-panel"><div className="panel-heading"><div><p className="section-label">01 / 个股排序</p><h2>严格个股候选</h2></div><p>没有不硬凑</p></div><div className="mt-4 grid gap-3">{stocks.length ? stocks.map((item: any, index: number) => <StockLine item={item} output={output} index={index} key={item.code} />) : <div className="empty-state"><p className="font-semibold">本轮没有严格个股候选</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">这不是“全市场没有低位对象”，而是没有对象同时通过状态、低位、流动性和方向性MACD硬门。请看右侧观察池与下方行业/主题发现池。</p></div>}</div></div><div className="dashboard-panel"><div className="panel-heading"><div><p className="section-label">02 / 共振排序</p><h2>严格行业主题共振</h2></div><p>严格交集</p></div><div className="mt-4 grid gap-3">{resonance.length ? resonance.map((item: any, index: number) => <StockLine item={{ ...item, score: item.score, state: "共振候选", macdQuality: "共振" }} output={output} index={index} key={item.code} />) : <div className="empty-state"><p className="font-semibold">本轮没有严格共振个股</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">行业/主题仍会在下方作为研究发现展示，但没有把宽松的板块统计伪装成可执行买入信号。</p></div>}</div></div></section>

    <section className="mt-8 dashboard-panel"><div className="panel-heading"><div><p className="section-label">03 / 低位观察池</p><h2>低位阶段个股</h2></div><p>点击进入个股详情 · 不是买入清单</p></div><p className="mt-3 text-sm leading-6 text-[var(--secondary)]">这些股票满足低位阶段条件，但可能缺少方向性MACD、行业共振或基本面确认。它们用于提前研究，不代表策略已经给出买入指令。</p><div className="mt-4 grid gap-3 md:grid-cols-2">{watchStocks.slice(0, 20).map((item: any, index: number) => <StockLine item={item} output={output} index={index} watch key={item.code} />)}</div></section>

    <section className="mt-8 dashboard-panel"><div className="panel-heading"><div><p className="section-label">04 / 板块发现</p><h2>申万二级行业低位发现</h2></div><p>点击行业查看对应成员</p></div><p className="mt-3 text-sm leading-6 text-[var(--secondary)]">行业发现层来自宽口径低位统计；它不要求行业已经出现严格个股候选，作用是告诉你“哪里值得进一步研究”。</p><div className="mt-4 grid gap-2 md:grid-cols-2">{industries.map((item: any) => <a href={item.detailRoute} key={item.detailRoute} className="block border-t border-[var(--line)] pt-3 transition hover:border-[var(--accent)]"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{item.rank}. {item.name}</p><p className="mt-1 text-xs text-[var(--muted)]">成员 {item.memberCount} · 低位比例 {ratio(item.lowRatio)} · 中位位置 {pct(item.medianPos60)} · MACD有利 {ratio(item.macdRatio)}</p></div><p className="text-sm font-semibold">{Number(item.score ?? 0).toFixed(2)}</p></div></a>)}</div></section>

    <section className="mt-4 dashboard-panel"><div className="panel-heading"><div><p className="section-label">05 / 主题发现</p><h2>同花顺主题低位发现</h2></div><p>点击主题查看对应成员</p></div><p className="mt-3 text-sm leading-6 text-[var(--secondary)]">主题映射截至 {output.mappingAsOf}。主题详情会列出映射成员中更值得优先复核的低位对象，并保留技术状态、成交额、资金和财务复核标记。</p><div className="mt-4 grid gap-2 md:grid-cols-2">{themes.map((item: any) => <a href={item.detailRoute} key={item.detailRoute} className="block border-t border-[var(--line)] pt-3 transition hover:border-[var(--accent)]"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{item.rank}. {item.name}</p><p className="mt-1 text-xs text-[var(--muted)]">映射成员 {item.memberCount} · 低位比例 {ratio(item.lowRatio)} · 中位位置 {pct(item.medianPos60)} · 正流比例 {ratio(item.flowRatio)}</p></div><p className="text-sm font-semibold">{Number(item.score ?? 0).toFixed(2)}</p></div></a>)}</div></section>

    <section className="mt-4 workspace-note"><p className="section-label">本轮科技 / 医药归因</p><p className="mt-2 text-sm leading-7 text-[var(--secondary)]">{diagnostics.technologyReason ?? "未保存独立科技归因。"}</p><p className="mt-2 text-sm leading-7 text-[var(--secondary)]">{diagnostics.medicalReason ?? "未保存独立医药归因。"}</p><p className="mt-3 text-xs text-[var(--muted)]">科技观察对象 {diagnostics.technologyCandidates ?? "—"} 只 · 医药观察对象 {diagnostics.medicalCandidates ?? "—"} 只</p></section>
  </ResearchShell>;
}
