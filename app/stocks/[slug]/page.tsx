import Link from "next/link";
import { ResearchShell } from "@/app/components/ResearchShell";
import catalog from "@/content/research/catalog.json";

const topicNames: Record<string, string> = { "800g-and-1-6t-optics": "800G与1.6T光互联", "thin-film-lithium-niobate": "薄膜铌酸锂", "optical-materials-and-devices": "光学材料与器件", "enterprise-ssd": "企业级SSD", "hbm-and-high-bandwidth-memory": "HBM与高带宽存储", "advanced-packaging": "先进封装", "ai-chip-architecture": "AI芯片架构", "high-speed-pcb-and-ccl": "高速PCB与CCL", "ai-data-center-power": "AI数据中心供电", "data-center-thermal-management": "数据中心热管理", "private-model-deployment": "私有模型部署" };

export function generateStaticParams() { return catalog.stocks.map((stock) => ({ slug: stock.slug })); }

export default async function StockDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const normalizedSlug = decodeURIComponent(slug);
  const stock = catalog.stocks.find((item) => item.slug === normalizedSlug);
  if (!stock) return null;
  return <ResearchShell eyebrow="03 / EQUITY FILE" title={`${stock.name} · ${stock.code}`} description="个股档案必须回到所属板块和专题，研究结论以事实、时点和反证为基础。">
    <div className="mt-4 flex flex-wrap gap-2"><Link href={`/themes/${stock.theme}`} className="research-tag">板块：{stock.theme === "ai-technology" ? "AI科技" : stock.theme}</Link><span className="research-tag">研究线：{stock.line}</span><Link href={`/topics/${stock.topic}`} className="research-tag">专题：{topicNames[stock.topic] ?? stock.topic}</Link></div>
    <section className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]"><div className="dashboard-panel"><p className="section-label">研究定位</p><h2 className="mt-3 text-xl font-semibold">{stock.role}</h2><p className="mt-4 text-sm leading-7 text-[var(--secondary)]">{stock.summary}</p></div><div className="dashboard-panel"><p className="section-label">当前状态</p><p className="mt-3 text-lg font-semibold text-[var(--accent-dark)]">{stock.stage}</p><p className="mt-3 text-xs leading-6 text-[var(--muted)]">此处后续补充业务拆分、客户与供应链、财务、估值、技术位置、催化和风险。当前页面是研究归属与档案入口，不直接构成交易建议。</p></div></section>
    <section className="mt-6 dashboard-panel"><p className="section-label">父级路径</p><h2 className="mt-2 text-lg font-semibold">板块 → 专题 → 个股</h2><div className="mt-4 grid gap-3 md:grid-cols-3"><Link href={`/themes/${stock.theme}`} className="border border-[var(--line)] p-4"><p className="section-label">板块</p><p className="mt-2 font-semibold">{stock.theme === "ai-technology" ? "AI科技" : stock.theme}</p></Link><Link href={`/topics/${stock.topic}`} className="border border-[var(--line)] p-4"><p className="section-label">专题</p><p className="mt-2 font-semibold">{topicNames[stock.topic] ?? stock.topic}</p></Link><div className="border border-[var(--accent)] bg-[rgba(250,248,243,.62)] p-4"><p className="section-label">个股</p><p className="mt-2 font-semibold">{stock.name}</p></div></div></section>
  </ResearchShell>;
}
