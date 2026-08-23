import Link from "next/link";
import { ResearchShell } from "@/app/components/ResearchShell";

const articles = [
  { slug: "ai-interconnect-20260823", kind: "专题研究", title: "AI互联线：从材料、光芯片到集群网络", dek: "把光互联拆成可验证的技术路线、需求传导和代表公司，作为后续个股与交易研究入口。", date: "2026-08-23", status: "已发布" },
  { slug: "20260822-ai-industry-value-chain-panorama-v3.html", kind: "板块研究", title: "AI全产业链分层详解", dek: "沿算力线、存储线、互联线、供电线、应用线、承载线，梳理从原材料到应用的产业链。", date: "2026-08-22", status: "已发布" },
  { slug: "ai-hardware-value-chain-20260822", kind: "专题研究", title: "AI硬件价值链：服务器、互联与供电散热", dek: "从终端需求反推设备构成，区分高价值环节、制造环节和仍待验证的下一代路线。", date: "2026-08-22", status: "已发布" },
];

export default function ReportsPage() {
  return <ResearchShell eyebrow="RESEARCH LIBRARY / ARTICLES" title="研究文章" description="研究成果以文章形式发布；每篇文章保留发布时间、更新状态和研究边界，避免把半成品当成结论。"><section className="article-index">{articles.map((article) => <Link href={`/reports/${article.slug}`} className="article-index-row" key={article.slug}><div><p className="section-label">{article.kind}</p><h2>{article.title}</h2><p>{article.dek}</p></div><div className="article-index-meta"><time>{article.date}</time><span>{article.status}</span><b>阅读 →</b></div></Link>)}</section><section className="workspace-note"><p className="section-label">发布边界</p><p>文章是研究成果的可读层；原始数据、策略运行文件和质量日志仍保存在本地项目目录。待复核、错误或作废内容不会混入公开文章列表。</p></section></ResearchShell>;
}
