import Link from "next/link";
import { ResearchShell } from "@/app/components/ResearchShell";
import moduleIndex from "@/content/research/modules/index.json";

export default function TopicsPage() {
  const topics = moduleIndex.items.flatMap((module) => module.topics.map((topic) => ({ topic, moduleId: module.id, moduleName: module.name })));
  return <ResearchShell eyebrow="02 / RESEARCH TOPIC" title="专题研究" description="专题可以独立进入，但每个专题都会显示所属板块与研究线，避免脱离产业上下文。">
    <div className="mt-4 border border-dashed border-[var(--line-strong)] bg-[rgba(250,248,243,.5)] p-4 text-xs leading-6 text-[var(--secondary)]">当前专题主要来自AI科技板块全景图。每个专题进入后，再挂接证据、公司和交易观察；未完成前不当作投资结论。</div>
    <div className="mt-4 grid gap-3 md:grid-cols-2">{topics.map(({ topic, moduleId, moduleName }) => <Link key={`${moduleId}-${topic}`} href={`/topics/${topic}`} className="border border-[var(--line)] bg-[rgba(250,248,243,.62)] p-4 transition hover:border-[var(--accent)]"><p className="section-label">板块：AI科技 / 研究线：{moduleName}</p><h2 className="mt-2 text-base font-semibold">{topic.replaceAll("-", " ")}</h2><p className="mt-2 text-xs text-[var(--muted)]">进入专题后查看关联个股与研究状态。</p><span className="mt-4 inline-block text-xs font-semibold text-[var(--accent-dark)]">打开专题入口 →</span></Link>)}</div>
  </ResearchShell>;
}
