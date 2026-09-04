import { ResearchShell } from "@/app/components/ResearchShell";
import shenwan from "@/content/research/directory/taxonomy/shenwan_directory.json";
import ths from "@/content/research/directory/taxonomy/ths_directory.json";
import { LazyCategory } from "./LazyCategory";

type Tag = { code: string; name: string; stockCount?: number };
type Stock = { tsCode: string; name: string; marketCapWan: number | null; close: number | null; tradeDate: string };
type SwNode = { code: string; name: string; level: number; parentCode?: string; stocks: Stock[]; thsTags: Tag[] };
type ThsCategory = { code: string; name: string; kind: "industry" | "theme"; stocks: Stock[]; shenwanTags: Tag[]; status: string };

const sw = shenwan as unknown as { asOf: string; source: { releaseId: string }; counts: { stocks: number; level1: number; level2: number; level3: number }; levels: { level1: SwNode[]; level2: SwNode[]; level3: SwNode[] } };
const thsView = ths as unknown as { counts: { stocks: number; industries: number; themes: number; industryStocks: number; themeStocks: number }; industries: ThsCategory[]; themes: ThsCategory[] };
const l2ByParent = new Map<string, SwNode[]>();
const l3ByParent = new Map<string, SwNode[]>();
for (const node of sw.levels.level2) l2ByParent.set(node.parentCode ?? "", [...(l2ByParent.get(node.parentCode ?? "") ?? []), node]);
for (const node of sw.levels.level3) l3ByParent.set(node.parentCode ?? "", [...(l3ByParent.get(node.parentCode ?? "") ?? []), node]);

function anchor(code: string) { return code.replace(/[^a-zA-Z0-9_-]/g, "-"); }

function SwLevel2({ node }: { node: SwNode }) {
  const children = l3ByParent.get(node.code) ?? [];
  const count = children.reduce((sum, child) => sum + child.stocks.length, 0);
  return <details className="directory-node directory-node-l2" id={`sw-l2-${anchor(node.code)}`}>
    <summary><span>{node.name}</span><em>{count} 只 / {children.length} 个三级行业</em><code>{node.code.replace(".SI", "")}</code></summary>
    <div className="directory-lazy-children">{children.map((child) => <LazyCategory key={child.code} kind="sw-l3" code={child.code} name={child.name} count={child.stocks.length} crossTags={child.thsTags} crossPrefix="mixed" />)}</div>
  </details>;
}

function SwLevel1({ node }: { node: SwNode }) {
  const children = l2ByParent.get(node.code) ?? [];
  const count = children.reduce((sum, child) => sum + (l3ByParent.get(child.code) ?? []).reduce((subtotal, l3) => subtotal + l3.stocks.length, 0), 0);
  return <details className="directory-node directory-node-l1" id={`sw-l1-${anchor(node.code)}`}>
    <summary><span>{node.name}</span><em>{count} 只 / {children.length} 个二级行业</em><code>{node.code.replace(".SI", "")}</code></summary>
    <div className="directory-lazy-children">{children.map((child) => <SwLevel2 node={child} key={child.code} />)}</div>
  </details>;
}

function ThsSection({ id, title, label, categories }: { id: "ths-industry" | "ths-theme"; title: string; label: string; categories: ThsCategory[] }) {
  return <section className="directory-section" id={id}><div className="directory-section-head"><div><p className="section-label">{label}</p><h2>{title}</h2></div><span>{title === "同花顺行业" ? "行业 → 个股" : "主题 → 个股"}</span></div><p className="directory-data-note">展开具体分类后加载完整个股、申万路径和同花顺标签。</p><div className="directory-tree">{categories.map((category) => <LazyCategory key={category.code} kind={id} code={category.code} name={category.name} count={category.stocks.length} status={category.status} crossTags={category.shenwanTags} crossPrefix="sw-l3" />)}</div></section>;
}

export default function DirectoryPage() {
  return <ResearchShell eyebrow="RESEARCH / DIRECTORY" title="行业目录" description=""><div className="directory-page">
    <div className="directory-stats"><div><strong>{sw.counts.level1}</strong><span>申万一级</span></div><div><strong>{sw.counts.level2}</strong><span>申万二级</span></div><div><strong>{sw.counts.level3}</strong><span>申万三级</span></div><div><strong>{sw.counts.stocks}</strong><span>可研究个股</span></div><div><strong>{thsView.counts.themes}</strong><span>同花顺主题</span></div></div>
    <nav className="directory-mode-nav"><a href="#shenwan">申万目录</a><a href="#ths-industry">同花顺行业</a><a href="#ths-theme">同花顺主题</a></nav>
    <section className="directory-section" id="shenwan"><div className="directory-section-head"><div><p className="section-label">SHENWAN</p><h2>申万目录</h2></div><span>一级 → 二级 → 三级 → 个股</span></div><p className="directory-data-note">最新交易日：{sw.asOf} · 个股按总市值降序 · 数据版本：{sw.source.releaseId} · 展开三级行业后查看完整个股和标签</p><div className="directory-tree">{sw.levels.level1.map((node) => <SwLevel1 node={node} key={node.code} />)}</div></section>
    <ThsSection id="ths-industry" title="同花顺行业" label="THS INDUSTRY" categories={thsView.industries} />
    <ThsSection id="ths-theme" title="同花顺主题" label="THS THEME" categories={thsView.themes} />
    <p className="directory-footnote">申万数据来自QDataHub验收版本；同花顺行业和主题为独立参考目录。展开个股分类后，可点击标签跳转到对应分类。</p>
  </div></ResearchShell>;
}
