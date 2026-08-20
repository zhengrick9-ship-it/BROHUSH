import { EmptyState, ResearchShell } from "@/app/components/ResearchShell";

export default function TradesPage() {
  return <ResearchShell eyebrow="07 / TRADE JOURNAL" title="交易记录" description="成交事实、当时理由和事后复盘分开保存；交易记录是组合决策的审计轨迹，不是盘中情绪的流水账。"><EmptyState label="TRADES / PRIVATE_BY_DEFAULT" /></ResearchShell>;
}
