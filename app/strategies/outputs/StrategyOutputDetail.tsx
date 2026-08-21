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

export function StrategyOutputDetail({ output, isLatest, archived = false }: { output: StrategyOutput; isLatest: boolean; archived?: boolean }) {
  const stocks = (output.stocks ?? []).filter((item: any) => !forbidden(item));
  const resonance = (output.resonance ?? []).filter((item: any) => !forbidden(item));
  const analysis = output.analysis ?? {};
  const diagnostics = output.sectorDiagnostics ?? {};
  return <ResearchShell eyebrow="STRATEGY LIBRARY / OUTPUT DETAIL" title={`${output.strategy ?? "策略输出"} · ${output.versionLabel ?? output.version}`} description="单个版本的完整结果、筛选边界与人工分析。历史版本保留，当前版本单独标记。">
    <section className="strategy-callout"><div><p className="section-label">{isLatest ? "最新版本" : "历史版本"} · {output.versionLabel}</p><h2>{output.strategy ?? "统一低位双维策略"} {output.version}</h2><p>{archived ? "这是历史原始版本，仅作复盘归档，不作为当前候选源。新版本已增加ST/退市/北交所边界和MACD方向性门槛。" : analysis.conclusion ?? "本轮先筛低位，再筛板块共振，并把结果交给人工复核。"}</p><p className="mt-3 text-xs text-[var(--muted)]">版本号：{output.versionId} · 运行：{output.runAt} · 数据截至：{output.asOf} · QDH：{output.releaseId}</p></div><div className="strategy-badges"><span>{isLatest ? "最新" : "存档"}</span><span>{output.gate ?? "QDH"}</span><span>人工复核</span><span>不自动交易</span></div></section>

    <section className="metric-grid metric-grid-wide mt-4">
      <div className="metric"><p className="section-label">可执行底表</p><p className="mt-3 text-xl font-semibold">{Number(output.universe ?? 0).toLocaleString()}</p><p className="mt-2 text-xs text-[var(--muted)]">原始 {Number(output.rawUniverse ?? output.universe ?? 0).toLocaleString()}</p></div>
      <div className="metric"><p className="section-label">机械候选</p><p className="mt-3 text-xl font-semibold">{output.mechanicalHits ?? 0}</p><p className="mt-2 text-xs text-[var(--muted)]">方向性MACD通过</p></div>
      <div className="metric"><p className="section-label">低位启动</p><p className="mt-3 text-xl font-semibold">{output.stageCounts?.LOW_ACTIVATING ?? 0}</p><p className="mt-2 text-xs text-[var(--muted)]">刚金叉/近三日金叉</p></div>
      <div className="metric"><p className="section-label">行业共振</p><p className="mt-3 text-xl font-semibold">{output.industryGates ?? 0}</p><p className="mt-2 text-xs text-[var(--muted)]">申万二级</p></div>
      <div className="metric"><p className="section-label">主题共振</p><p className="mt-3 text-xl font-semibold">{output.themeGates ?? 0}</p><p className="mt-2 text-xs text-[var(--muted)]">研究映射层</p></div>
    </section>

    <section className="mt-4 grid gap-4 lg:grid-cols-2">
      <div className="workspace-note"><p className="section-label">策略分析</p><p className="mt-2 text-sm leading-7 text-[var(--secondary)]">{analysis.macd ?? "位置与MACD共同判断，旧版未保存独立分析字段。"}</p><p className="mt-2 text-sm leading-7 text-[var(--secondary)]">{analysis.howToUse ?? "低位结果不等于买入信号，仍需结合行业、业务、财务和催化复核。"}</p></div>
      <div className="workspace-note"><p className="section-label">数据与排除边界</p><p className="mt-2 text-sm leading-7 text-[var(--secondary)]">{output.dataNote}</p><p className="mt-2 text-xs text-[var(--muted)]">排除记录：{JSON.stringify(output.excludedByReason ?? {})} · 页面再次过滤异常证券：{archived ? "是" : "是"}</p></div>
    </section>

    <section className="mt-8 grid gap-4 lg:grid-cols-2">
      <div className="dashboard-panel"><div className="panel-heading"><div><p className="section-label">01 / 个股排序</p><h2>纯个股低位榜</h2></div><p>仅展示有效证券</p></div><div className="mt-4 grid gap-2">{stocks.map((item: any, index: number) => <div className="border-t border-[var(--line)] pt-3" key={item.code}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{index + 1}. {item.name} <span className="font-normal text-[var(--muted)]">{item.code}</span></p><p className="mt-1 text-xs text-[var(--secondary)]">{item.industry} · {item.state} · MACD {item.macd} · {item.macdQuality ?? "旧版未记录质量状态"}</p></div><div className="text-right"><p className="text-sm font-semibold">{Number(item.score ?? 0).toFixed(2)}</p><ScoreBar value={Number(item.score ?? 0)} /></div></div><p className="mt-2 text-xs text-[var(--muted)]">60日位置 {pct(item.pos60)} · 20日涨跌 {pct(item.r20)} · 20日均额 {Math.round(Number(item.amount20 ?? 0)).toLocaleString()}千元 · 复核：{reviewLabel[item.review] ?? item.review ?? "—"}</p></div>)}</div></div>
      <div className="dashboard-panel"><div className="panel-heading"><div><p className="section-label">02 / 共振排序</p><h2>行业 + 主题加分榜</h2></div><p>研究优先级，不等于买入</p></div><div className="mt-4 grid gap-2">{resonance.map((item: any, index: number) => <div className="border-t border-[var(--line)] pt-3" key={item.code}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{index + 1}. {item.name} <span className="font-normal text-[var(--muted)]">{item.code}</span></p><p className="mt-1 text-xs text-[var(--secondary)]">{item.industry} · {item.theme} · {item.macd}</p></div><div className="text-right"><p className="text-sm font-semibold">{Number(item.score ?? 0).toFixed(2)}</p><ScoreBar value={Number(item.score ?? 0)} /></div></div><p className="mt-2 text-xs text-[var(--muted)]">纯个股 {Number(item.stockScore ?? 0).toFixed(2)} · 60日位置 {pct(item.pos60)} · 20日涨跌 {pct(item.r20)} · 复核：{reviewLabel[item.review] ?? item.review ?? "—"}</p></div>)}</div></div>
    </section>

    <section className="mt-8 dashboard-panel"><div className="panel-heading"><div><p className="section-label">03 / 板块共振</p><h2>申万二级低位行业</h2></div><p>先看板块，再看个股</p></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead className="text-[var(--muted)]"><tr><th className="py-3 pr-4">排名</th><th className="py-3 pr-4">行业</th><th className="py-3 pr-4">评分</th><th className="py-3 pr-4">低位比例</th><th className="py-3 pr-4">中位位置</th><th className="py-3 pr-4">MACD有利比例</th><th className="py-3">正流比例</th></tr></thead><tbody>{(output.industries ?? []).map((item: any, index: number) => <tr className="border-t border-[var(--line)]" key={item.name}><td className="py-3 pr-4">{index + 1}</td><td className="py-3 pr-4 font-semibold">{item.name}</td><td className="py-3 pr-4">{Number(item.score ?? 0).toFixed(2)}</td><td className="py-3 pr-4">{ratio(item.lowRatio)}</td><td className="py-3 pr-4">{pct(item.medianPos60)}</td><td className="py-3 pr-4">{ratio(item.macdRatio)}</td><td className="py-3">{ratio(item.flowRatio)}</td></tr>)}</tbody></table></div></section>

    <section className="mt-4 dashboard-panel"><div className="panel-heading"><div><p className="section-label">04 / 主题研究映射</p><h2>同花顺主题低位榜</h2></div><p>映射截至 {output.mappingAsOf}</p></div><div className="mt-4 grid gap-2 md:grid-cols-2">{(output.themes ?? []).map((item: any, index: number) => <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3" key={item.name}><div><p className="text-sm font-semibold">{index + 1}. {item.name}</p><p className="mt-1 text-xs text-[var(--muted)]">低位 {ratio(item.lowRatio)} · 中位位置 {pct(item.medianPos60)} · 正流 {ratio(item.flowRatio)}</p></div><p className="text-sm font-semibold">{Number(item.score ?? 0).toFixed(2)}</p></div>)}</div></section>

    <section className="mt-4 workspace-note"><p className="section-label">本轮科技 / 医药归因</p><p className="mt-2 text-sm leading-7 text-[var(--secondary)]">{diagnostics.technologyReason ?? "旧版本未保存科技归因。"}</p><p className="mt-2 text-sm leading-7 text-[var(--secondary)]">{diagnostics.medicalReason ?? "旧版本未保存医药归因。"}</p><p className="mt-3 text-xs text-[var(--muted)]">科技候选 {diagnostics.technologyCandidates ?? "—"} 只 · 医药候选 {diagnostics.medicalCandidates ?? "—"} 只</p></section>
  </ResearchShell>;
}
