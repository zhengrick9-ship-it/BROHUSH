import Link from "next/link";
import { ResearchShell } from "@/app/components/ResearchShell";
import moduleIndex from "@/content/research/modules/index.json";

export default function ModulesPage() {
  return <ResearchShell eyebrow="02 / VALUE MODULE" title="价值模块" description="把板块拆成可以单独跟踪的价值模块，并记录模块之间的产业链关系。">
    <div className="mt-4 grid gap-3 md:grid-cols-2">{moduleIndex.items.map((item) => <Link key={item.id} href={`/modules/${item.id}`} className="group border border-[var(--line)] bg-[rgba(250,248,243,.62)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)]"><div className="flex items-start justify-between gap-4"><div><p className="section-label">AI MODULE / 研究中</p><h2 className="mt-2 text-lg font-semibold">{item.name}</h2></div><span className="research-tag">已建立框架</span></div><p className="mt-3 text-sm leading-6 text-[var(--secondary)]">{item.short}</p><div className="mt-4 grid gap-2 border-t border-[var(--line)] pt-3 text-xs leading-5"><p><b>需求：</b>{item.demandPath}</p><p><b>制造：</b>{item.manufacturingPath}</p></div></Link>)}</div>
  </ResearchShell>;
}
