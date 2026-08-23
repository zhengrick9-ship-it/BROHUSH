import type { ReactNode } from "react";

export function ArticleDocument({ kind, title, dek, publishedAt, updatedAt, status = "已发布", children }: { kind: string; title: string; dek: string; publishedAt: string; updatedAt?: string; status?: string; children: ReactNode }) {
  return <article className="article-document"><header className="article-header"><p className="section-label">{kind}</p><h2>{title}</h2><p className="article-dek">{dek}</p><div className="article-meta"><span>发布 {publishedAt}</span>{updatedAt && <span>更新 {updatedAt}</span>}<span>{status}</span></div></header><div className="article-body">{children}</div></article>;
}

export function ArticleSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="article-section"><h3>{title}</h3>{children}</section>;
}
