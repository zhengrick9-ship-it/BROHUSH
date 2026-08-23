import Link from "next/link";
import { ResearchShell } from "@/app/components/ResearchShell";

const layers = [
  ["01", "板块", "/themes", "先判断大产业、需求方向和制造底座。"],
  ["02", "专题", "/topics", "围绕技术路线、供需、客户验证和催化深入研究。"],
  ["03", "个股", "/stocks", "把公司挂回所属板块与专题，区分龙头、弹性和风险。"],
];

export default function ResearchHomePage() {
  return <ResearchShell eyebrow="RESEARCH LIBRARY" title="从板块到专题，再到个股。" description="研究库只保留三个层级。板块页面承载产业全景，并向下挂接专题与个股；专题和个股也可以独立检索，但始终显示所属关系。">
    <section className="library-section research-flow"><div className="panel-heading"><div><p className="section-label">RESEARCH FLOW</p><h2>板块 → 专题 → 个股</h2></div><p>父级关系贯穿每一层。</p></div><div className="research-layer-grid">{layers.map(([number, title, href, text]) => <Link href={href} className="research-layer" key={href}><span>{number}</span><h3>{title}</h3><p>{text}</p><i>进入 →</i></Link>)}</div></section>
    <section className="dashboard-panel research-feature"><div className="panel-heading"><div><p className="section-label">ACTIVE THEME</p><h2>AI科技</h2></div><Link href="/themes/ai-technology">进入板块全景 →</Link></div><p className="mt-4 text-sm leading-7 text-[var(--secondary)]">AI科技板块下，已建立需求传导与制造拆解双向全景；算力线、存储线、互联线、供电线、应用线和承载线作为专题标签继续使用。</p><div className="mt-5 flex flex-wrap gap-2">{["算力线", "存储线", "互联线", "供电线", "应用线", "承载线"].map((item) => <span className="research-tag" key={item}>{item}</span>)}</div></section>
  </ResearchShell>;
}
