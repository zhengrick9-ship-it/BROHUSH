import Link from "next/link";
import type { ReactNode } from "react";

const navigation = [
  { href: "/themes", label: "板块" },
  { href: "/modules", label: "模块" },
  { href: "/topics", label: "专题" },
  { href: "/stocks", label: "个股" },
  { href: "/reports", label: "报告" },
  { href: "/plans", label: "作战计划" },
  { href: "/market", label: "市场" },
  { href: "/portfolio", label: "组合" },
  { href: "/trades", label: "交易" },
];

export function ResearchShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="site-header">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <Link href="/" className="flex items-center gap-3 text-[var(--text)]">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--text)] text-sm font-semibold tracking-[0.12em]">Y</span>
            <span className="text-sm font-semibold tracking-[0.16em]">YOLO</span>
          </Link>
          <nav className="flex max-w-[72vw] gap-1 overflow-x-auto" aria-label="主导航">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className="whitespace-nowrap px-3 py-2 text-xs text-[var(--muted)] transition hover:bg-[var(--paper-strong)] hover:text-[var(--text)]">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-16">
        <section className="hero-grid">
          <p className="section-label">{eyebrow}</p>
          <div className="mt-4 max-w-4xl">
            <h1 className="font-display text-4xl leading-[1.12] tracking-[-0.035em] text-[var(--text)] md:text-6xl">{title}</h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--secondary)]">{description}</p>
          </div>
        </section>
        {children}
      </main>
    </div>
  );
}

export function EmptyState({ label = "内容正在接入" }: { label?: string }) {
  return (
    <div className="border border-dashed border-[var(--line-strong)] bg-[rgba(250,248,243,0.5)] px-6 py-10">
      <p className="section-label">{label}</p>
      <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--secondary)]">
        当前 manifest 仍是空初始状态。研究结果会先在本地完成证据、时间和质量标记，再发布到这里；不会用空壳名单冒充已完成研究。
      </p>
    </div>
  );
}

export function LinkCard({ href, label, title, text }: { href: string; label: string; title: string; text: string }) {
  return (
    <Link href={href} className="group block border border-[var(--line)] bg-[rgba(250,248,243,0.58)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--paper-strong)]">
      <p className="section-label">{label}</p>
      <h2 className="mt-3 text-lg font-semibold text-[var(--text)]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--secondary)]">{text}</p>
      <span className="mt-5 inline-block text-xs font-semibold text-[var(--accent-dark)] transition group-hover:translate-x-1">查看入口 →</span>
    </Link>
  );
}
