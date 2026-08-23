import Link from "next/link";
import { ResearchShell } from "@/app/components/ResearchShell";
import catalog from "@/content/research/catalog.json";

export default function ThemesPage() {
  return <ResearchShell eyebrow="01 / INDUSTRY" title="板块研究" description="先判断大产业与需求方向，再进入该板块下的专题和个股。">
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      {catalog.themes.map((theme) => <section className="dashboard-panel" key={theme.id}>
          <div className="panel-heading"><div><p className="section-label">板块 / {theme.status === "active" ? "已发布" : "待建档"}</p><h2>{theme.name}</h2></div><span className="research-tag">{theme.status === "active" ? "已发布" : "待建档"}</span></div>
        <p className="mt-4 text-sm leading-7 text-[var(--secondary)]">{theme.summary}</p>
        <p className="mt-4 border-l-2 border-[var(--accent)] pl-3 text-xs leading-6 text-[var(--muted)]">{theme.description}</p>
      </section>)}
    </div>
  </ResearchShell>;
}
