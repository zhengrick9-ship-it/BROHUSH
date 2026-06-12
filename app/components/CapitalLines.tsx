import type { Summary } from '@/lib/wcw2026/types'

export function CapitalLines({ summary }: { summary: Summary }) {
  const settledReturn = Math.max(0, summary.settledStake + summary.settledProfit)
  const max = Math.max(summary.totalStake, summary.settledStake, settledReturn, 1)
  const lines = [
    { label: '累计投入', value: summary.totalStake, color: 'var(--accent)' },
    { label: '完赛投入', value: summary.settledStake, color: 'var(--text)' },
    { label: '累计收益', value: settledReturn, color: 'var(--green)' },
  ]

  return (
    <section className="capital-lines" aria-label="投入与收益">
      {lines.map((line) => (
        <div key={line.label} className="capital-line">
          <span>{line.label}</span>
          <div className="capital-track">
            <i
              style={{
                width: `${(line.value / max) * 100}%`,
                background: line.color,
              }}
            />
          </div>
          <strong>{money(line.value)}</strong>
        </div>
      ))}
    </section>
  )
}

function money(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 2,
  }).format(value)
}

