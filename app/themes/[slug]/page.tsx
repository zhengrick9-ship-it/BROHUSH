import Link from "next/link";
import { ResearchShell } from "@/app/components/ResearchShell";
import theme from "@/content/research/themes/ai-technology.json";
import moduleIndex from "@/content/research/modules/index.json";

export function generateStaticParams() { return [{ slug: theme.id }]; }

export default async function ThemeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== theme.id) return null;
  return <ResearchShell eyebrow="01 / INDUSTRY / AI TECHNOLOGY" title={theme.name} description={theme.thesis}>
    <div className="mt-4 border border-[var(--line)] bg-[var(--paper-strong)] p-4 text-xs leading-6 text-[var(--secondary)]"><b>状态：</b>{theme.researchStage}。<b className="ml-3">截至：</b>{theme.evidence.asOf}。<b className="ml-3">数据：</b>{theme.evidence.qualityStatus}，不直接构成交易信号。</div>
    <section className="mt-8 grid gap-3 md:grid-cols-2"><article className="dashboard-panel"><p className="section-label">DEMAND DIMENSION</p><h2 className="mt-2 text-lg font-semibold">需求传导：客户为什么要买</h2><p className="mt-3 text-sm leading-7 text-[var(--secondary)]">{theme.architecture.demandDimension}</p><p className="mt-4 border-l-2 border-[var(--accent)] pl-3 text-xs leading-6">从终端应用、工作负载和部署方式反推系统采购，避免只看某个零部件的概念热度。</p></article><article className="dashboard-panel"><p className="section-label">MANUFACTURING DIMENSION</p><h2 className="mt-2 text-lg font-semibold">制造拆解：价值如何兑现</h2><p className="mt-3 text-sm leading-7 text-[var(--secondary)]">{theme.architecture.manufacturingDimension}</p><p className="mt-4 border-l-2 border-[var(--accent)] pl-3 text-xs leading-6">从材料、设备、工艺到部件和系统，追踪技术壁垒、供给瓶颈和利润传导。</p></article></section>
    <section className="mt-8 dashboard-panel"><p className="section-label">MEETING NODES</p><h2 className="mt-2 text-lg font-semibold">两条路径汇合的可交付节点</h2><pre className="mt-5 overflow-x-auto whitespace-pre-wrap border border-[var(--line)] bg-[#f4f1e9] p-4 text-xs leading-7 text-[var(--text)]">{`客户应用 / 私有部署 / 云服务\n          ↓ 工作负载与采购需求\nAI服务器 ─ 高速网络 ─ 存储系统 ─ 电力系统 ─ 散热系统 ─ 数据中心 ─ 软件与安全\n          ↑ 部件、材料、设备、制造工艺与供应链\n     可用算力 = 芯片性能 × 网络效率 × 存储吞吐 × 供电散热可靠性 × 软件利用率`}</pre></section>
    <section className="mt-8"><div className="panel-heading"><div><p className="section-label">VALUE MODULES</p><h2>模块入口</h2></div><Link href="/modules">模块总表 →</Link></div><div className="mt-4 grid gap-3 md:grid-cols-2">{moduleIndex.items.map((item) => <Link key={item.id} href={`/modules/${item.id}`} className="border border-[var(--line)] bg-[rgba(250,248,243,.62)] p-4 transition hover:border-[var(--accent)]"><p className="section-label">{item.id}</p><h3 className="mt-2 font-semibold">{item.name}</h3><p className="mt-2 text-xs leading-6 text-[var(--secondary)]">{item.short}</p><p className="mt-3 text-xs leading-5"><b>瓶颈：</b>{item.bottleneck}</p></Link>)}</div></section>
    <section className="mt-8 dashboard-panel"><p className="section-label">RESEARCH RULES</p><h2 className="mt-2 text-lg font-semibold">后续专题与个股如何挂接</h2><ul className="compact-list">{theme.researchQuestions.map((question) => <li key={question}><span>{question}</span></li>)}</ul><p className="mt-4 text-xs leading-6 text-[var(--muted)]">当前公司档案尚未在本次板块更新中发布。下一步按模块建立专题，再将经过身份、业务和时点证据校验的个股挂到专题下。</p></section>
  </ResearchShell>;
}
