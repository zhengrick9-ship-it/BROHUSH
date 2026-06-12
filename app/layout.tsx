import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "2DOGS · WCW2026",
  description: "世界杯共同投注、赛果与收益记录",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
