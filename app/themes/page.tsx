import Link from "next/link";
import { ResearchShell } from "@/app/components/ResearchShell";
import theme from "@/content/research/themes/ai-technology.json";
import moduleIndex from "@/content/research/modules/index.json";

export default function ThemesPage() {
  const modules = moduleIndex.items.slice(0, 4);
  return <ResearchShell eyebrow="01 / INDUSTRY" title="板块地图" description="从大产业开始，记录景气方向、产业位置、核心矛盾和未来可能的价值迁移。">
    <section className="dashboard-panel mt-4">
      <div className="panel-heading"><div><p className="section-label">THEME / ACTIVE</p><h2>{theme.name}</h2></div><Link href={`/themes/${theme.id}`}>进入全景图 →</Link></div>
      <p className="mt-4 max-w-4xl text-sm leading-7 text-[var(--secondary)]">{theme.thesis}</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="border border-[var(--line)] bg-[rgba(250,248,243,.62)] p-4"><p className="section-label">需求传导维度</p><p className="mt-3 text-sm leading-6">{theme.architecture.demandDimension}</p></div>
        <div className="border border-[var(--line)] bg-[rgba(250,248,243,.62)] p-4"><p className="section-label">制造拆解维度</p><p className="mt-3 text-sm leading-6">{theme.architecture.manufacturingDimension}</p></div>
      </div>
    </section>
    <section className="library-section mt-4"><div className="panel-heading"><div><p className="section-label">MODULES / PREVIEW</p><h2>AI价值模块</h2></div><Link href="/modules">全部模块 →</Link></div><div className="library-grid">{modules.map((item) => <Link key={item.id} href={`/modules/${item.id}`} className="library-card"><span>AI MODULE</span><h3>{item.name}</h3><p>{item.short}</p><i>查看模块 →</i></Link>)}</div></section>
  </ResearchShell>;
}
