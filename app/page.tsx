import Link from "next/link";
import { ResearchShell } from "@/app/components/ResearchShell";

const updates = [
  { date: "2026-08-23 12:45", kind: "专题研究", title: "AI互联线：光模块、光芯片、材料与CPO设备复核稿", href: "/reports" },
  { date: "2026-08-22 18:40", kind: "板块研究", title: "AI产业链全景：算力、存储、互联、供电、应用、承载", href: "/themes/ai-technology" },
  { date: "2026-08-22 16:20", kind: "专题研究", title: "AI硬件价值链：从芯片、封装到服务器与数据中心", href: "/reports/ai-hardware-value-chain-20260822" },
  { date: "2026-08-21 15:29", kind: "策略输出", title: "低位双维策略：个股、主题与共振排序", href: "/strategies/outputs" },
  { date: "2026-08-21 09:30", kind: "交易计划", title: "周频作战计划：持仓条件与盘中检查项", href: "/plans" },
];

const libraries = [
  { href: "/research", label: "研究库", title: "板块 → 专题 → 个股", text: "把产业逻辑、价值迁移和公司档案串成一条可追踪的研究路径。" },
  { href: "/trading", label: "交易库", title: "持仓 → 交易 → 作战 → 复盘", text: "个人组合与交易过程单独保存。" },
  { href: "/strategies", label: "策略库", title: "机制 → 参数 → 策略输出", text: "保存交易规则、运行版本、候选排序和策略解释。" },
];

export default function HomePage() {
  return <ResearchShell eyebrow="YOLO / 首页" title="首页" description="">
    <section className="updates-panel">
      <div className="panel-heading"><div><p className="section-label">RECENT UPDATES</p><h2>近期更新</h2></div></div>
      <div className="updates-list">{updates.map((item) => <Link href={item.href} key={`${item.date}-${item.title}`} className="update-row"><span className="update-kind">{item.kind}</span><span className="update-title">{item.title}</span><time>{item.date}</time><span className="update-arrow">→</span></Link>)}</div>
    </section>
    <section className="library-section home-libraries"><div className="panel-heading"><div><p className="section-label">LIBRARIES</p><h2>三库入口</h2></div></div><div className="library-grid home-library-grid">{libraries.map((item) => <Link key={item.href} href={item.href} className="library-card"><span>{item.label}</span><h3>{item.title}</h3><p>{item.text}</p><i>进入 →</i></Link>)}</div></section>
  </ResearchShell>;
}
