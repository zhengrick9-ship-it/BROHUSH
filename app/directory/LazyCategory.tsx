"use client";

import { useState } from "react";

type Tag = { code: string; name: string; stockCount?: number };
type Stock = { tsCode: string; name: string; marketCapWan: number | null; sw: { l1: Tag; l2: Tag; l3: Tag } | null; thsIndustries: Tag[]; thsThemes: Tag[] };

function anchor(code: string) { return code.replace(/[^a-zA-Z0-9_-]/g, "-"); }
function marketCap(value: number | null) {
  if (value == null || Number.isNaN(value)) return "—";
  const yi = value / 10000;
  return `${yi >= 10000 ? `${(yi / 10000).toFixed(2)}万亿` : yi.toFixed(1)}亿`;
}
function TagLinks({ tags, prefix }: { tags: Tag[]; prefix: "sw-l1" | "sw-l2" | "sw-l3" | "ths-industry" | "ths-theme" }) {
  if (!tags.length) return <span className="directory-no-tags">暂无</span>;
  return <span className="directory-stock-tags">{tags.map((tag) => <a key={`${prefix}-${tag.code}`} href={`#${prefix}-${anchor(tag.code)}`}>{tag.name}</a>)}</span>;
}
function StockTaxonomy({ stock }: { stock: Stock }) {
  if (!stock.sw) return <div className="directory-stock-labels"><span className="directory-no-tags">暂无分类映射</span></div>;
  return <div className="directory-stock-labels">
    <div className="directory-stock-label-group"><b>申万路径</b><TagLinks tags={[stock.sw.l1]} prefix="sw-l1" /><TagLinks tags={[stock.sw.l2]} prefix="sw-l2" /><TagLinks tags={[stock.sw.l3]} prefix="sw-l3" /></div>
    <div className="directory-stock-label-group"><b>同花顺行业</b><TagLinks tags={stock.thsIndustries} prefix="ths-industry" /></div>
    <details className="directory-stock-label-details"><summary>同花顺主题 · {stock.thsThemes.length} 个</summary><TagLinks tags={stock.thsThemes} prefix="ths-theme" /></details>
  </div>;
}
function StockList({ stocks }: { stocks: Stock[] }) {
  return <div className="directory-stock-list"><p className="directory-stock-note">按总市值降序，共{stocks.length}只</p>{stocks.map((stock) => <div className="directory-stock-row" id={`stock-${anchor(stock.tsCode)}`} key={stock.tsCode}>
    <div className="directory-stock-identity"><div className="directory-stock-name"><strong>{stock.name}</strong><code>{stock.tsCode}</code></div><StockTaxonomy stock={stock} /></div>
    <span className="directory-stock-cap">{marketCap(stock.marketCapWan)}</span>
  </div>)}</div>;
}
export function CategoryCrossTags({ tags, prefix }: { tags: Tag[]; prefix: "sw-l3" | "ths-industry" | "ths-theme" | "mixed" }) {
  if (!tags.length) return <span className="directory-no-tags">暂无交叉标签</span>;
  return <span className="directory-cross-tags">{tags.slice(0, 6).map((tag) => { const target = prefix === "mixed" ? (tag.code.startsWith("881") ? "ths-industry" : "ths-theme") : prefix; return <a key={`${target}-${tag.code}`} href={`#${target}-${anchor(tag.code)}`}>{tag.name}{tag.stockCount ? ` · ${tag.stockCount}` : ""}</a>; })}</span>;
}
export function LazyCategory({ kind, code, name, count, status, crossTags = [], crossPrefix }: { kind: "sw-l3" | "ths-industry" | "ths-theme"; code: string; name: string; count: number; status?: string; crossTags?: Tag[]; crossPrefix?: "sw-l3" | "ths-industry" | "ths-theme" | "mixed" }) {
  const [stocks, setStocks] = useState<Stock[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const load = async () => {
    if (stocks || loading) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/directory/category?kind=${encodeURIComponent(kind)}&code=${encodeURIComponent(code)}`);
      if (!response.ok) throw new Error(`加载失败（${response.status}）`);
      const payload = await response.json() as { stocks: Stock[] };
      setStocks(payload.stocks);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };
  return <details className="directory-node directory-node-lazy" id={`${kind}-${anchor(code)}`} onToggle={(event) => { if (event.currentTarget.open) void load(); }}>
    <summary><span>{name}</span><em>{count} 只</em><code>{code.replace(/\.(SI|TI)$/, "")}</code></summary>
    {crossPrefix ? <div className="directory-cross-row"><span>{kind === "sw-l3" ? "同花顺对应" : "对应申万三级"}</span><CategoryCrossTags tags={crossTags} prefix={crossPrefix} /></div> : null}
    {loading ? <p className="directory-lazy-status">正在加载完整个股与分类标签…</p> : null}
    {error ? <p className="directory-lazy-status directory-lazy-error">{error}</p> : null}
    {stocks ? <StockList stocks={stocks} /> : null}
    {status ? <p className="directory-data-note directory-category-status">{status}</p> : null}
  </details>;
}
