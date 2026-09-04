import { NextRequest, NextResponse } from "next/server";
import shenwan from "@/content/research/directory/taxonomy/shenwan_directory.json";
import ths from "@/content/research/directory/taxonomy/ths_directory.json";
import stockMaster from "@/content/research/directory/members/stock_master.json";

type Tag = { code: string; name: string; stockCount?: number };
type TaxonomyStock = { tsCode: string; name: string; marketCapWan: number | null; close: number | null; tradeDate: string };
type MasterStock = TaxonomyStock & { sw: { l1: Tag; l2: Tag; l3: Tag }; thsIndustries: Tag[]; thsThemes: Tag[] };
type SwNode = { code: string; name: string; stocks: TaxonomyStock[] };
type ThsCategory = { code: string; name: string; kind: "industry" | "theme"; stocks: TaxonomyStock[] };

const sw = shenwan as unknown as { levels: { level3: SwNode[] } };
const thsView = ths as unknown as { industries: ThsCategory[]; themes: ThsCategory[] };
const master = new Map((stockMaster as unknown as { stocks: MasterStock[] }).stocks.map((stock) => [stock.tsCode, stock]));

function toStock(stock: TaxonomyStock) {
  const mapping = master.get(stock.tsCode);
  return { ...stock, sw: mapping?.sw ?? null, thsIndustries: mapping?.thsIndustries ?? [], thsThemes: mapping?.thsThemes ?? [] };
}

export function GET(request: NextRequest) {
  const kind = request.nextUrl.searchParams.get("kind");
  const code = request.nextUrl.searchParams.get("code");
  if (!kind || !code) return NextResponse.json({ error: "kind and code are required" }, { status: 400 });
  if (kind === "sw-l3") {
    const category = sw.levels.level3.find((node) => node.code === code);
    if (!category) return NextResponse.json({ error: "category not found" }, { status: 404 });
    return NextResponse.json({ kind, code, stocks: category.stocks.map(toStock) }, { headers: { "Cache-Control": "public, max-age=3600" } });
  }
  const categories = kind === "ths-industry" ? thsView.industries : kind === "ths-theme" ? thsView.themes : null;
  if (!categories) return NextResponse.json({ error: "unsupported kind" }, { status: 400 });
  const category = categories.find((item) => item.code === code);
  if (!category) return NextResponse.json({ error: "category not found" }, { status: 404 });
  return NextResponse.json({ kind, code, stocks: category.stocks.map(toStock) }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
