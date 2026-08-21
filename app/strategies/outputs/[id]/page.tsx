import latestOutput from "@/content/strategy-outputs/20260821T152922-dual-low-v1.5-timeaware-status-macd-coherence-ex-st-bj-fixed.json";
import previousV15Output from "@/content/strategy-outputs/20260821T141414-dual-low-v1.5-timeaware-status-macd-coherence-ex-st-bj.json";
import v14Output from "@/content/strategy-outputs/20260821T125743-dual-low-v1.4-macd-gate-ex-st-bj.json";
import v13Output from "@/content/strategy-outputs/20260821T123020-dual-low-v1.3-ex-st-bj.json";
import previousOutput from "@/content/strategy-outputs/2026-08-21-low-position.json";
import strategyManifest from "@/content/strategy-outputs/index.json";
import { StrategyOutputDetail } from "../StrategyOutputDetail";

const outputs: Record<string, any> = {
  "20260821T152922-dual-low-v1.5-timeaware-status-macd-coherence-ex-st-bj-fixed": latestOutput,
  "20260821T141414-dual-low-v1.5-timeaware-status-macd-coherence-ex-st-bj": previousV15Output,
  "20260821T125743-dual-low-v1.4-macd-gate-ex-st-bj": v14Output,
  "20260821T123020-dual-low-v1.3-ex-st-bj": v13Output,
  "20260821T113741-dual-low-v1.2-live": previousOutput,
};

export function generateStaticParams() {
  return strategyManifest.runs.map((run) => ({ id: run.id }));
}

export default async function StrategyOutputVersionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const output = outputs[id] ?? latestOutput;
  return <StrategyOutputDetail output={output} isLatest={id === strategyManifest.latest} archived={id !== strategyManifest.latest} />;
}
