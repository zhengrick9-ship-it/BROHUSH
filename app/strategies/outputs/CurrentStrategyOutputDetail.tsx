import Link from "next/link";
import { ResearchShell } from "@/app/components/ResearchShell";

type Recommendation = {
  rank: number;
  code: string;
  name: string;
  action: string;
  score: number;
  close: number;
  signal: string;
  valuation: string;
  reason: string;
  invalidation: string;
};

type StrategyRun = {
  id: string;
  name: string;
  candidateCount: number;
  status: string;
  conclusion: string;
  recommendations: Recommendation[];
  nearMisses?: string;
};

export function CurrentStrategyOutputDetail({ output }: { output: any }) {
  return <ResearchShell eyebrow="STRATEGY LIBRARY / OUTPUT DETAIL" title={output.version} description="四套策略独立运行；以下是当日收盘扫描、人工复核与历史回测结果。">
    <section className="strategy-callout"><div><p className="section-label">最新收盘版本</p><h2>低位金叉窗口四策略</h2><p>{output.analysis.conclusion}</p><p className="mt-3 text-xs text-[var(--muted)]">运行：{output.runAt} · 数据截至：{output.asOf} · QDH：{output.releaseId}</p></div><div className="strategy-badges"><span>最新</span><span>{output.gate}</span><span>人工复核</span><span>不自动交易</span></div></section>

    <section className="mt-4 dashboard-panel"><div className="panel-heading"><div><p className="section-label">运行结论</p><h2>先看信号，再看反证</h2></div><p>排名只用于排序，不是收益预测。</p></div><div className="mt-4 grid gap-3 md:grid-cols-4">{(output.strategyRuns as StrategyRun[]).map((run) => <div className="border border-[var(--line)] bg-[rgba(250,248,243,0.58)] p-4" key={run.id}><p className="text-xs font-semibold text-[var(--accent-dark)]">{run.id}</p><p className="mt-2 text-sm font-semibold">{run.name}</p><p className="mt-3 text-2xl font-semibold">{run.candidateCount}</p><p className="text-xs text-[var(--muted)]">候选数量</p><p className="mt-3 text-xs leading-6 text-[var(--secondary)]">{run.status}</p></div>)}</div></section>

    <section className="mt-4 grid gap-4">{(output.strategyRuns as StrategyRun[]).map((run) => <article className="dashboard-panel" key={run.id}><div className="panel-heading"><div><p className="section-label">{run.id}</p><h2>{run.name}</h2></div><span className="text-xs text-[var(--muted)]">{run.candidateCount} 个候选</span></div><p className="mt-4 text-sm leading-7 text-[var(--secondary)]">{run.conclusion}</p>{run.recommendations.length ? <div className="mt-4 grid gap-4">{run.recommendations.map((item) => <div className="border-t border-[var(--line)] pt-4" key={`${run.id}-${item.code}`}><div className="flex flex-wrap items-baseline justify-between gap-2"><div><span className="mr-2 text-xs font-semibold text-[var(--accent-dark)]">研究优先级 {item.rank}</span><span className="text-base font-semibold">{item.name}</span><span className="ml-2 text-xs text-[var(--muted)]">{item.code}</span></div><span className="text-xs font-semibold text-[var(--accent-dark)]">{item.action}</span></div><div className="mt-3 grid gap-2 text-xs leading-6 text-[var(--secondary)] md:grid-cols-2"><p><b>收盘 / 分数：</b>{item.close} / {item.score}</p><p><b>形态信号：</b>{item.signal}</p><p><b>估值：</b>{item.valuation}</p><p><b>失效条件：</b>{item.invalidation}</p></div><p className="mt-3 text-sm leading-7"><b>分析与理由：</b>{item.reason}</p></div>)}</div> : <div className="mt-4 border border-dashed border-[var(--line-strong)] px-5 py-5 text-sm leading-7 text-[var(--secondary)]">本轮无合格信号，不为了凑名单而降低门槛。{run.nearMisses && <><br />{run.nearMisses}</>}</div>}</article>)}</section>

    <section className="mt-4 dashboard-panel"><div className="panel-heading"><div><p className="section-label">历史回测 · 截至 2026-08-28</p><h2>四套策略对比</h2></div><p>当前扫描与回测是两个时间口径，不能混用。</p></div><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-[var(--line)] text-xs text-[var(--muted)]"><th className="py-3 pr-4">策略</th><th className="py-3 pr-4">信号数</th><th className="py-3 pr-4">5日均值</th><th className="py-3 pr-4">10日均值</th><th className="py-3 pr-4">20日均值</th><th className="py-3 pr-4">10日胜率</th><th className="py-3">10日最大回撤</th></tr></thead><tbody>{(["L0", "L1", "L2", "L3"] as const).map((key) => { const row = output.backtest[key]; return <tr className="border-b border-[var(--line)]" key={key}><td className="py-3 pr-4 font-semibold">{key}</td><td className="py-3 pr-4">{row?.signals ?? "—"}</td><td className="py-3 pr-4">{row?.mean5 ?? "—"}</td><td className="py-3 pr-4">{row?.mean10 ?? "—"}</td><td className="py-3 pr-4">{row?.mean20 ?? "—"}</td><td className="py-3 pr-4">{row?.win10 == null ? "—" : `${row.win10}%`}</td><td className="py-3">{row?.mdd10 == null ? "—" : `${row.mdd10}%`}</td></tr>; })}</tbody></table></div><p className="mt-4 text-xs leading-6 text-[var(--muted)]">L0 本轮没有可比收益样本；L1 召回宽但历史表现弱；L2/L3 收紧条件后历史样本更少、表现更好，但不代表未来必然延续。</p></section>

    <section className="mt-4 dashboard-panel"><div className="panel-heading"><div><p className="section-label">可追溯文件</p><h2>底表与源代码</h2></div><p>下载后可复核本轮输入与运行结果。</p></div><div className="mt-4 grid gap-3 md:grid-cols-2"><Link className="library-card" href="/strategy-data/low-cross-window-v1/current_strategy_candidates.csv"><span>CSV</span><h3>当日四策略候选底表</h3><p>收盘扫描的全量候选与技术、资金字段。</p><i>打开文件 →</i></Link><Link className="library-card" href="/strategy-data/low-cross-window-v1/strategy_metrics.csv"><span>CSV</span><h3>历史策略指标</h3><p>回测聚合结果与归因底表。</p><i>打开文件 →</i></Link><Link className="library-card" href="/strategy-source/low-cross-window-v1/README.md"><span>文档</span><h3>策略组说明</h3><p>四套策略的目标、规则、边界与执行方式。</p><i>打开文件 →</i></Link><Link className="library-card" href="/strategies/mechanisms"><span>机制</span><h3>交易机制总览</h3><p>查看每套策略的规则、源代码和独立运行入口。</p><i>进入机制库 →</i></Link></div></section>
  </ResearchShell>;
}
