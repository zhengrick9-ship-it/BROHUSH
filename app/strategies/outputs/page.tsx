import strategyManifest from "@/content/strategy-outputs/index.json";
import latestOutput from "@/content/strategy-outputs/20260821T152922-dual-low-v1.5-timeaware-status-macd-coherence-ex-st-bj-fixed.json";
import { ResearchShell } from "@/app/components/ResearchShell";

export default function StrategyOutputsPage() {
  const runs = [...strategyManifest.runs].sort((a, b) => b.runAt.localeCompare(a.runAt));
  return <ResearchShell eyebrow="STRATEGY LIBRARY / OUTPUTS" title="策略输出" description="每次运行单独保留；列表页只做版本索引，点击后进入对应版本详情。">
    <section className="strategy-callout"><div><p className="section-label">最新版本 · {latestOutput.versionLabel}</p><h2>统一低位双维策略</h2><p>{latestOutput.analysis?.conclusion ?? "最新策略结果已发布。"}</p><p className="mt-3 text-xs text-[var(--muted)]">运行：{latestOutput.runAt} · 数据截至：{latestOutput.asOf} · QDH：{latestOutput.releaseId}</p></div><div className="strategy-badges"><span>最新</span><span>QDH {latestOutput.gate}</span><span>人工复核</span><span>不自动交易</span></div></section>

    <section className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="dashboard-panel"><p className="section-label">最新版关键摘要</p><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-[var(--muted)]">可执行底表</p><p className="mt-1 text-xl font-semibold">{Number(latestOutput.universe).toLocaleString()}</p></div><div><p className="text-xs text-[var(--muted)]">机械候选</p><p className="mt-1 text-xl font-semibold">{latestOutput.mechanicalHits}</p></div><div><p className="text-xs text-[var(--muted)]">低位启动</p><p className="mt-1 text-xl font-semibold">{(latestOutput.stageCounts as any).LOW_ACTIVATING ?? 0}</p></div><div><p className="text-xs text-[var(--muted)]">MACD规则</p><p className="mt-1 text-sm font-semibold">方向性硬门</p></div></div></div>
      <div className="dashboard-panel"><p className="section-label">使用边界</p><p className="mt-3 text-sm leading-7 text-[var(--secondary)]">{latestOutput.analysis?.howToUse}</p><p className="mt-2 text-sm leading-7 text-[var(--secondary)]">{latestOutput.analysis?.risk}</p></div>
    </section>

    <section className="mt-4 dashboard-panel"><div className="panel-heading"><div><p className="section-label">版本归档</p><h2>运行记录 · 新 → 旧</h2></div><p>每个版本独立查看</p></div><div className="mt-4 grid gap-3">{runs.map((run) => <a href={run.route ?? `/strategies/outputs/${run.id}`} key={run.id} className="block border-t border-[var(--line)] pt-4 transition hover:border-[var(--accent)]"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{run.versionLabel}</p><p className="mt-1 text-xs text-[var(--muted)]">数据截至 {run.asOf} · 运行 {run.runAt} · {run.releaseId}</p></div>{run.id === strategyManifest.latest ? <span className="text-xs font-semibold text-[var(--accent-dark)]">最新</span> : <span className="text-xs text-[var(--muted)]">历史存档</span>}</div><p className="mt-2 text-xs leading-6 text-[var(--secondary)]">{run.summary}</p><p className="mt-2 text-xs font-semibold text-[var(--accent-dark)]">查看该版本详情 →</p></a>)}</div></section>
  </ResearchShell>;
}
