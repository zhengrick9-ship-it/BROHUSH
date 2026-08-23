import Link from "next/link";
import { ResearchShell } from "@/app/components/ResearchShell";

const updates = [
  { date: "2026-08-23 19:58", kind: "板块研究", title: "AI科技板块产业链总图：六线总纲与利润池", href: "/reports/ai-panorama-six-lines-20260823" },
  { date: "2026-08-23 18:58", kind: "专题研究", title: "光模块散热赛道：导热材料、液冷与陶瓷封装", href: "/reports/optical-module-thermal-investment-20260823" },
  { date: "2026-08-23 18:28", kind: "专题研究", title: "AI互联线：光模块、光芯片、设备、介质与网络服务", href: "/reports/ai-interconnect-investment-20260823" },
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
