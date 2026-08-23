import Link from "next/link";
import { ResearchShell } from "@/app/components/ResearchShell";
import moduleIndex from "@/content/research/modules/index.json";

export default function TopicsPage() {
  const topics = moduleIndex.items.flatMap((module) => module.topics.map((topic) => ({ topic, moduleId: module.id, moduleName: module.name })));
  return <ResearchShell eyebrow="02 / RESEARCH TOPIC" title="专题研究" description="专题可以独立进入，但每个专题都会显示所属板块与研究线，避免脱离产业上下文。">
    <div className="mt-4 border border-dashed border-[var(--line-strong)] bg-[rgba(250,248,243,.5)] p-4 text-xs leading-6 text-[var(--secondary)]"><b>研究状态：</b>当前专题均为研究入口，尚未发布完整专题结论。</div>
    <div className="mt-4 grid gap-3 md:grid-cols-2">{topics.map(({ topic, moduleId, moduleName }) => <Link key={`${moduleId}-${topic}`} href={`/topics/${topic}`} className="border border-[var(--line)] bg-[rgba(250,248,243,.62)] p-4 transition hover:border-[var(--accent)]"><div className="flex items-start justify-between gap-2"><p className="section-label">板块：AI科技 / 研究线：{moduleName}</p><span className="research-tag">待研究</span></div><h2 className="mt-2 text-base font-semibold">{topic.replaceAll("-", " ")}</h2><p className="mt-2 text-xs text-[var(--muted)]">当前为专题入口，尚未形成完整研究结论。</p><span className="mt-4 inline-block text-xs font-semibold text-[var(--accent-dark)]">打开专题入口 →</span></Link>)}</div>
  </ResearchShell>;
}
