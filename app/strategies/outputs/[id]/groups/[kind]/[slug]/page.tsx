import latestOutput from "@/content/strategy-outputs/20260821T141414-dual-low-v1.5-timeaware-status-macd-coherence-ex-st-bj.json";
import v14Output from "@/content/strategy-outputs/20260821T125743-dual-low-v1.4-macd-gate-ex-st-bj.json";
import v13Output from "@/content/strategy-outputs/20260821T123020-dual-low-v1.3-ex-st-bj.json";
import previousOutput from "@/content/strategy-outputs/2026-08-21-low-position.json";
import strategyManifest from "@/content/strategy-outputs/index.json";
import { GroupDetail } from "../../../../GroupDetail";

const outputs: Record<string, any> = {
  "20260821T141414-dual-low-v1.5-timeaware-status-macd-coherence-ex-st-bj": latestOutput,
  "20260821T125743-dual-low-v1.4-macd-gate-ex-st-bj": v14Output,
  "20260821T123020-dual-low-v1.3-ex-st-bj": v13Output,
  "20260821T113741-dual-low-v1.2-live": previousOutput,
};

export function generateStaticParams() {
  return strategyManifest.runs.flatMap((run) => {
    const output = outputs[run.id];
    if (!output) return [];
    return [...(output.industries ?? []).filter((group: any) => group.slug).map((group: any) => ({ id: run.id, kind: "industry", slug: group.slug })), ...(output.themes ?? []).filter((group: any) => group.slug).map((group: any) => ({ id: run.id, kind: "theme", slug: group.slug }))];
  });
}

export default async function StrategyOutputGroupPage({ params }: { params: Promise<{ id: string; kind: string; slug: string }> }) {
  const { id, kind, slug } = await params;
  const output = outputs[id] ?? latestOutput;
  const groups = kind === "theme" ? (output.themeDetails ?? output.themes ?? []) : (output.industryDetails ?? output.industries ?? []);
  const group = groups.find((row: any) => row.slug === decodeURIComponent(slug));
  if (!group) return <GroupDetail output={output} group={{ name: "未找到", kind, score: 0, members: [] }} />;
  return <GroupDetail output={output} group={group} />;
}
