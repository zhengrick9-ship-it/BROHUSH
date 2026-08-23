import { EmptyState, ResearchShell } from "@/app/components/ResearchShell";
import { requirePrivateSession } from "@/lib/auth/private";

export const dynamic = "force-dynamic";

export default async function MarketPage() {
  await requirePrivateSession("/market");
  return <ResearchShell eyebrow="MARKET REVIEW" title="市场复盘" description="记录指数、成交、板块轮动、资金结构和事件冲击；市场判断与个股建议分开，避免把盘面噪声直接写进持仓逻辑。"><EmptyState label="MARKET / EMPTY" /></ResearchShell>;
}
