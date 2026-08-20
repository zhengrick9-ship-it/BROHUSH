import { EmptyState, ResearchShell } from "@/app/components/ResearchShell";

export default function TopicsPage() {
  return <ResearchShell eyebrow="03 / RESEARCH TOPIC" title="专题研究" description="围绕技术路线、供需、客户验证、催化和风险，形成可复查的研究专题。"><EmptyState label="TOPICS / EMPTY" /></ResearchShell>;
}
