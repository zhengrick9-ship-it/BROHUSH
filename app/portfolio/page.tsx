import { EmptyState, ResearchShell } from "@/app/components/ResearchShell";

export default function PortfolioPage() {
  return <ResearchShell eyebrow="06 / PORTFOLIO" title="组合看板" description="组合只接收已确认的持仓和研究结论；盘中数据与交易记录留在本地，不直接暴露到公开站点。"><EmptyState label="PORTFOLIO / PRIVATE_BY_DEFAULT" /></ResearchShell>;
}
