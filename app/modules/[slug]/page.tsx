import Link from "next/link";
import { ResearchShell } from "@/app/components/ResearchShell";
import moduleIndex from "@/content/research/modules/index.json";

export function generateStaticParams() { return moduleIndex.items.map((item) => ({ slug: item.id })); }

export default async function ModuleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = moduleIndex.items.find((module) => module.id === slug);
  if (!item) return null;
  return <ResearchShell eyebrow={`02 / VALUE MODULE / ${item.id}`} title={item.name} description={item.short}>
    <div className="mt-4 flex flex-wrap gap-3 text-xs"><Link href="/themes/ai-technology" className="text-[var(--accent-dark)]">← 返回AI全景图</Link><Link href="/topics" className="text-[var(--accent-dark)]">专题队列 →</Link></div>
    <section className="mt-6 grid gap-3 md:grid-cols-2"><article className="dashboard-panel"><p className="section-label">DEMAND PATH</p><h2 className="mt-2 text-lg font-semibold">需求逻辑</h2><p className="mt-3 text-sm leading-7 text-[var(--secondary)]">{item.demandPath}</p></article><article className="dashboard-panel"><p className="section-label">MANUFACTURING PATH</p><h2 className="mt-2 text-lg font-semibold">制造逻辑</h2><p className="mt-3 text-sm leading-7 text-[var(--secondary)]">{item.manufacturingPath}</p></article></section>
    <section className="mt-4 dashboard-panel"><p className="section-label">CURRENT BOTTLENECK</p><h2 className="mt-2 text-lg font-semibold">价值兑现的关键约束</h2><p className="mt-3 text-sm leading-7 text-[var(--secondary)]">{item.bottleneck}</p></section>
    <section className="mt-8"><div className="panel-heading"><div><p className="section-label">TOPIC SEEDS</p><h2>专题入口</h2></div><span className="text-xs text-[var(--muted)]">状态：待逐项研究</span></div><div className="mt-4 grid gap-3 md:grid-cols-3">{item.topics.map((topic) => <Link key={topic} href={`/topics/${topic}`} className="border border-[var(--line)] bg-[rgba(250,248,243,.62)] p-4 transition hover:border-[var(--accent)]"><p className="section-label">TOPIC</p><h3 className="mt-2 text-sm font-semibold">{topic.replaceAll("-", " ")}</h3><p className="mt-3 text-xs leading-5 text-[var(--muted)]">进入专题档案，后续挂接证据和个股。</p></Link>)}</div></section>
  </ResearchShell>;
}
