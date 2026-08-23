import Link from "next/link";
import { ResearchShell } from "@/app/components/ResearchShell";
import report from "@/content/research/themes/ai-hardware-value-chain-deep-dive-v1.json";

export default function AIHardwareDeepDivePage() {
  return <ResearchShell eyebrow="01 / INDUSTRY / AI HARDWARE" title={report.title} description={report.thesis}>
    <div className="mt-4 flex flex-wrap gap-3 border border-[var(--line)] bg-[var(--paper-strong)] p-4 text-xs leading-6 text-[var(--secondary)]">
      <span><b>版本：</b>{report.version}</span><span><b>截至：</b>{report.asOf}</span><span><b>状态：</b>{report.qualityStatus}</span>
      <Link className="ml-auto text-[var(--accent-dark)]" href="/themes/ai-technology">返回AI全景图 →</Link>
    </div>

    <section className="mt-6 dashboard-panel">
      <p className="section-label">NVIDIA SUPPLY FLOW</p>
      <h2 className="mt-2 text-xl font-semibold">英伟达芯片：设计、制造、封装到系统交付</h2>
      <p className="mt-3 text-sm leading-7 text-[var(--secondary)]">公开资料可以确认平台和主要工艺路线，但不能把生态公司名单直接当成NVIDIA已确认供应商。所有A股映射后续仍要做点时身份、公告和业务证据核验。</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">{report.nvidiaFlow.map((item) => <article key={item.stage} className="border border-[var(--line)] bg-[rgba(250,248,243,.62)] p-4"><p className="section-label">{item.stage}</p><p className="mt-2 text-sm leading-6">{item.fact}</p><div className="mt-3 flex flex-wrap gap-1">{item.representatives.map((company) => <span key={company} className="rounded border border-[var(--line)] px-2 py-1 text-[10px] text-[var(--muted)]">{company}</span>)}</div></article>)}</div>
    </section>

    <section className="mt-6">
      <div className="panel-heading"><div><p className="section-label">VALUE MODULES</p><h2>当前路线与下一代路线</h2></div><span className="text-xs text-[var(--muted)]">从瓶颈找价值</span></div>
      <div className="mt-4 grid gap-4">{report.modules.map((item) => <article key={item.id} className="dashboard-panel"><div className="flex flex-wrap items-baseline justify-between gap-2"><div><p className="section-label">{item.id}</p><h3 className="mt-1 text-lg font-semibold">{item.name}</h3></div><span className="text-xs text-[var(--muted)]">代表公司不是直接供货确认</span></div><div className="mt-4 grid gap-3 md:grid-cols-2"><div className="border-l-2 border-[var(--accent)] pl-3"><p className="section-label">CURRENT ROUTE</p><p className="mt-2 text-sm leading-6">{item.currentRoute}</p></div><div className="border-l-2 border-[#6b8f8b] pl-3"><p className="section-label">NEXT ROUTE</p><p className="mt-2 text-sm leading-6">{item.nextRoute}</p></div></div><div className="mt-4 grid gap-3 md:grid-cols-2"><div><p className="section-label">瓶颈</p><p className="mt-2 text-sm leading-6 text-[var(--secondary)]">{item.bottleneck}</p></div><div><p className="section-label">投资含义</p><p className="mt-2 text-sm leading-6 text-[var(--secondary)]">{item.investment}</p></div></div><div className="mt-4"><p className="section-label">GLOBAL / A-SHARE MAPPING</p><div className="mt-2 flex flex-wrap gap-1">{[...item.global, ...item.china].map((company) => <span key={company} className="rounded border border-[var(--line)] px-2 py-1 text-[10px]">{company}</span>)}</div></div><p className="mt-4 border-l-2 border-[#b45b4b] pl-3 text-xs leading-6 text-[var(--secondary)]"><b>风险：</b>{item.risk}</p></article>)}</div>
    </section>

    <section className="mt-6 dashboard-panel"><p className="section-label">RESEARCH PRIORITY</p><h2 className="mt-2 text-xl font-semibold">后续专题优先级</h2><div className="mt-4 grid gap-2">{report.priority.map((item) => <div key={item.rank} className="flex gap-3 border-b border-[var(--line)] py-3 last:border-0"><b className="text-[var(--accent-dark)]">0{item.rank}</b><div><h3 className="font-semibold">{item.name}</h3><p className="mt-1 text-sm leading-6 text-[var(--secondary)]">{item.reason}</p></div></div>)}</div><p className="mt-5 border-l-2 border-[var(--accent)] pl-3 text-xs leading-6 text-[var(--secondary)]">下一步个股报告必须补齐：真实业务、客户/订单、财务兑现、估值、当前位置、催化、失效条件，以及QDataHub点时身份过滤。技术先进不等于可以立即买入。</p></section>

    <section className="mt-6 dashboard-panel"><p className="section-label">SOURCES</p><h2 className="mt-2 text-xl font-semibold">公开资料入口</h2><div className="mt-4 grid gap-2 md:grid-cols-2">{report.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="border border-[var(--line)] p-3 text-sm text-[var(--accent-dark)] hover:border-[var(--accent)]">{source.name} ↗</a>)}</div></section>
  </ResearchShell>;
}
