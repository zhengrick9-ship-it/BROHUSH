import { notFound } from "next/navigation";
import { ResearchShell } from "@/app/components/ResearchShell";
import { mechanismById, mechanisms } from "../mechanisms";

export function generateStaticParams() { return mechanisms.map((item) => ({ id: item.id })); }

export default async function MechanismDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = mechanismById[id];
  if (!item) notFound();
  return <ResearchShell eyebrow={`STRATEGY LIBRARY / MECHANISM / ${item.id}`} title={item.name} description={item.purpose}>
    <section className="strategy-callout"><div><p className="section-label">运行方式</p><h2>{item.runtime}</h2><p>{item.recommendation}</p></div><div className="strategy-badges"><span>{item.id}</span><span>不自动交易</span></div></section>
    <section className="mt-4 dashboard-panel"><div className="panel-heading"><div><p className="section-label">RULES</p><h2>筛选条件</h2></div><p>单套策略完整口径</p></div><ol className="mt-4 grid gap-3">{item.rules.map((rule, index) => <li className="border-t border-[var(--line)] pt-3 text-sm leading-7" key={rule}><span className="mr-3 text-xs font-semibold text-[var(--accent-dark)]">0{index + 1}</span>{rule}</li>)}</ol></section>
    <section className="mt-4 dashboard-panel"><div className="panel-heading"><div><p className="section-label">CURRENT RUN</p><h2>{item.currentRunTitle ?? "2026-08-31 收盘结果"}</h2></div><a href={item.currentRunHref ?? "/strategies/outputs/20260831T224529-low-cross-window-v1"} className="text-xs font-semibold text-[var(--accent-dark)]">查看完整输出 →</a></div><p className="mt-4 text-sm leading-7 text-[var(--secondary)]">{item.result}</p></section>
    <section className="mt-4 dashboard-panel"><div className="panel-heading"><div><p className="section-label">SOURCE</p><h2>源文件</h2></div></div><div className="mt-4 grid gap-2 text-sm">{(item.sourceLinks ?? [
      { label: "本套策略 config.json →", href: `/strategy-source/low-cross-window-v1/strategies/${item.id}/config.json` },
      { label: "完整 registry.json →", href: "/strategy-source/low-cross-window-v1/registry.json" },
      { label: "回测源代码 run_walkforward.py →", href: "/strategy-source/low-cross-window-v1/run_walkforward.py" },
      { label: "说明文档 README.md →", href: "/strategy-source/low-cross-window-v1/README.md" }
    ]).map((source) => <a key={source.href} className="border-t border-[var(--line)] pt-3 text-[var(--accent-dark)]" href={source.href}>{source.label}</a>)}</div></section>
  </ResearchShell>;
}
