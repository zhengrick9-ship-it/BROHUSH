import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YOLO · 研究站",
  description: "板块、专题与个股的个人研究工作台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
