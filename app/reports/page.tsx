import { EmptyState, ResearchShell } from "@/app/components/ResearchShell";

export default function ReportsPage() {
  return <ResearchShell eyebrow="05 / RESEARCH ARCHIVE" title="报告归档" description="周末复盘、盘前计划、专题研报和组合复盘按日期归档，保留当时的事实和判断。"><EmptyState label="REPORTS / EMPTY" /></ResearchShell>;
}
