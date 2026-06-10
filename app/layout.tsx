import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BRORUSH",
  description: "项目协作记录系统",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
