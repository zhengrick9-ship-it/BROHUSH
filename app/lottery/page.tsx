import type { Metadata } from "next";
import { ResearchShell } from "@/app/components/ResearchShell";
import LotteryPicker from "./LotteryPicker";
export const metadata: Metadata = { title: "幸运选号室 · YOLO", description: "大乐透、双色球、七星彩等六种玩法的随机选号小工具。只选号，不预测，不售彩。" };
export default function LotteryPage() {
  return <ResearchShell eyebrow="YOLO / PLAYGROUND" title="幸运选号室" description="给理性的日常，留一点随机的趣味。"><LotteryPicker /></ResearchShell>;
}
