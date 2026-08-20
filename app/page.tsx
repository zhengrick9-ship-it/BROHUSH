import { EmptyState, LinkCard, ResearchShell } from "@/app/components/ResearchShell";

const entryCards = [
  ["01 / INDUSTRY", "/themes", "板块地图", "先判断大产业的景气、政策、资金和未来方向，再决定是否进入研究。"],
  ["02 / MODULE", "/modules", "价值模块", "把产业拆成光互联、存储、供电散热、创新药等可跟踪的价值模块。"],
  ["03 / TOPIC", "/topics", "专题研究", "围绕技术路线、供需变化、客户验证、催化与风险形成可复用专题。"],
  ["04 / EQUITY", "/stocks", "个股档案", "记录业务、产业位置、估值、走势、催化、证据和明确的持有/退出条件。"],
  ["05 / REPORT", "/reports", "研究报告", "把周末复盘、作战计划和专题报告按日期沉淀，作为个人决策记录。"],
  ["06 / PORTFOLIO", "/portfolio", "组合看板", "只展示经过确认的持仓、成本、逻辑和风险，不把盘中噪声写成长期结论。"],
];

export default function HomePage() {
  return (
    <ResearchShell eyebrow="YOLO / PERSONAL RESEARCH OS" title="把市场研究变成一套可以持续维护的系统。" description="YOLO 是个人投资研究站：从板块到模块，从专题到个股，把产业逻辑、价值点、催化、风险和交易计划放在同一条证据链上。">
      <section className="metric-grid metric-grid-wide">
        <div className="metric"><p className="section-label">层级</p><p className="mt-3 text-2xl font-semibold">4</p><p className="mt-2 text-xs text-[var(--muted)]">板块 / 模块 / 专题 / 个股</p></div>
        <div className="metric"><p className="section-label">数据边界</p><p className="mt-3 text-2xl font-semibold">本地优先</p><p className="mt-2 text-xs text-[var(--muted)]">QDH / QMT 不直接暴露到公网</p></div>
        <div className="metric"><p className="section-label">当前状态</p><p className="mt-3 text-2xl font-semibold text-[var(--accent-dark)]">初始化</p><p className="mt-2 text-xs text-[var(--muted)]">内容 manifest 等待首批审核</p></div>
      </section>

      <section className="mt-12">
        <div className="advice-header"><div><p className="section-label">研究导航</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em]">从大到小，逐层收敛。</h2></div><p className="max-w-sm text-right text-xs leading-6 text-[var(--muted)]">研究、组合与交易各自有入口，再通过关系字段互相回溯。</p></div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{entryCards.map(([label, href, title, text]) => <LinkCard key={href} label={label} href={href} title={title} text={text} />)}</div>
      </section>

      <section className="mt-12"><EmptyState label="CONTENT MANIFEST / EMPTY_INITIAL_STATE" /></section>
    </ResearchShell>
  );
}
