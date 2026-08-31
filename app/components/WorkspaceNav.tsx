import Link from "next/link";

type NavItem = { href: string; label: string; children?: NavItem[] };
type LibraryGroup = { label: string; href: string; links: NavItem[] };

const libraryGroups: LibraryGroup[] = [
  { label: "研究库", href: "/research", links: [
    { href: "/directory", label: "目录" },
    { href: "/themes", label: "板块", children: [{ href: "/themes/ai-technology", label: "AI科技" }, { href: "/themes/biopharma", label: "生物医药" }] },
    { href: "/topics", label: "专题" },
    { href: "/stocks", label: "个股" },
  ] },
  { label: "交易库", href: "/trading", links: [
    { href: "/portfolio", label: "持仓" }, { href: "/trades", label: "交易明细" },
    { href: "/plans", label: "作战计划", children: [{ href: "/plans", label: "计划版本" }, { href: "/market", label: "市场复盘" }] },
  ] },
  { label: "策略库", href: "/strategies", links: [
    { href: "/strategies/mechanisms", label: "交易机制", children: [{ href: "/strategies/mechanisms/L0_SALTLAKE_EXACT", label: "L0 严格盐湖式" }, { href: "/strategies/mechanisms/L1_CROSS_WINDOW_PURE", label: "L1 纯形态" }, { href: "/strategies/mechanisms/L2_EARLY_FLOW_MARKET", label: "L2 资金大盘" }, { href: "/strategies/mechanisms/L3_EARLY_FLOW_MARKET_PLUS", label: "L3 筑底增强" }] },
    { href: "/strategies/outputs", label: "策略输出", children: [{ href: "/strategies/outputs/20260831T224529-low-cross-window-v1", label: "2026-08-31最新" }, { href: "/strategies/outputs#archive", label: "版本归档" }] },
  ] },
];

function TreeItem({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  return <div className={`workspace-tree-item workspace-tree-depth-${depth}`}>
    <Link href={item.href}>{item.label}</Link>
    {item.children && <div className="workspace-tree-children">{item.children.map((child) => <TreeItem item={child} depth={depth + 1} key={`${item.href}-${child.href}`} />)}</div>}
  </div>;
}

export function WorkspaceNav() {
  return <nav className="workspace-sidebar" aria-label="主导航">
    <Link href="/" className="workspace-sidebar-brand"><span className="workspace-sidebar-brand-name">YOLO</span><span>个人研究系统</span></Link>
    <Link href="/" className="workspace-sidebar-home">首页</Link>
    {libraryGroups.map((group) => <section className="workspace-sidebar-group" key={group.label}>
      <Link href={group.href} className="workspace-sidebar-group-title">{group.label}</Link>
      <div className="workspace-tree">{group.links.map((item) => <TreeItem item={item} key={item.href} />)}</div>
    </section>)}
    <p className="workspace-sidebar-foot">YOLO · 研究与交易</p>
  </nav>;
}
