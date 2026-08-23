import Link from "next/link";
import { ResearchShell } from "@/app/components/ResearchShell";
import catalog from "@/content/research/catalog.json";

export default function StocksPage() {
  return <ResearchShell eyebrow="03 / EQUITY FILE" title="个股研究" description="个股可以独立进入，但必须显示所属板块、研究线和专题，不再孤立看代码。">
    <div className="mt-4 border border-dashed border-[var(--line-strong)] bg-[rgba(250,248,243,.5)] p-4 text-xs leading-6 text-[var(--secondary)]">以下为当前YOLO研究库已建立的个股映射与研究入口。产业映射不等于买入建议，详细结论以个股档案中的证据和时点为准。</div>
    <div className="mt-4 grid gap-3 md:grid-cols-2">{catalog.stocks.map((stock) => <Link key={stock.code} href={`/stocks/${stock.slug}`} className="border border-[var(--line)] bg-[rgba(250,248,243,.62)] p-4 transition hover:border-[var(--accent)]"><div className="flex items-start justify-between gap-3"><div><p className="section-label">{stock.theme === "ai-technology" ? "AI科技" : stock.theme} / {stock.line}</p><h2 className="mt-2 text-base font-semibold">{stock.name} <span className="text-xs font-normal text-[var(--muted)]">{stock.code}</span></h2></div><span className="text-xs text-[var(--accent-dark)]">进入 →</span></div><p className="mt-3 text-xs leading-6 text-[var(--secondary)]">{stock.summary}</p><div className="mt-3 flex flex-wrap gap-2"><span className="research-tag">专题：{stock.topic}</span><span className="research-tag">{stock.stage}</span></div></Link>)}</div>
  </ResearchShell>;
}
