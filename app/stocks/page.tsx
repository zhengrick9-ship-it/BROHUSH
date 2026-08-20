import { EmptyState, ResearchShell } from "@/app/components/ResearchShell";

export default function StocksPage() {
  return <ResearchShell eyebrow="04 / EQUITY FILE" title="个股档案" description="个股不是孤立的代码，而是产业链价值点的映射；每个档案都需要业务和行情证据。"><EmptyState label="STOCKS / EMPTY" /></ResearchShell>;
}
