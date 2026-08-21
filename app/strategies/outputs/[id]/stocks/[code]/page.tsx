import latestOutput from "@/content/strategy-outputs/20260821T152922-dual-low-v1.5-timeaware-status-macd-coherence-ex-st-bj-fixed.json";
import previousV15Output from "@/content/strategy-outputs/20260821T141414-dual-low-v1.5-timeaware-status-macd-coherence-ex-st-bj.json";
import v14Output from "@/content/strategy-outputs/20260821T125743-dual-low-v1.4-macd-gate-ex-st-bj.json";
import v13Output from "@/content/strategy-outputs/20260821T123020-dual-low-v1.3-ex-st-bj.json";
import previousOutput from "@/content/strategy-outputs/2026-08-21-low-position.json";
import strategyManifest from "@/content/strategy-outputs/index.json";
import { StockDetail } from "../../../StockDetail";

const outputs: Record<string, any> = {
  "20260821T152922-dual-low-v1.5-timeaware-status-macd-coherence-ex-st-bj-fixed": latestOutput,
  "20260821T141414-dual-low-v1.5-timeaware-status-macd-coherence-ex-st-bj": previousV15Output,
  "20260821T125743-dual-low-v1.4-macd-gate-ex-st-bj": v14Output,
  "20260821T123020-dual-low-v1.3-ex-st-bj": v13Output,
  "20260821T113741-dual-low-v1.2-live": previousOutput,
};

export function generateStaticParams() {
  return strategyManifest.runs.flatMap((run) => {
    const output = outputs[run.id];
    if (!output) return [];
    return [...(output.stocks ?? []), ...(output.watchStocks ?? [])].map((item: any) => ({ id: run.id, code: item.code }));
  });
}

export default async function StrategyOutputStockPage({ params }: { params: Promise<{ id: string; code: string }> }) {
  const { id, code } = await params;
  const output = outputs[id] ?? latestOutput;
  const decoded = decodeURIComponent(code);
  const item = [...(output.stocks ?? []), ...(output.watchStocks ?? [])].find((row: any) => row.code === decoded);
  if (!item) return <StockDetail output={output} item={{ code: decoded, name: "未找到", industry: "—", state: "数据不可用", macd: "—", macdQuality: "—", score: 0 }} isStrict={false} />;
  const isStrict = (output.stocks ?? []).some((row: any) => row.code === item.code);
  return <StockDetail output={output} item={item} isStrict={isStrict} />;
}
