import type { Summary } from '@/lib/wcw2026/types'

export function CapitalLines({ summary }: { summary: Summary }) {
  const max = Math.max(
    summary.totalStake,
    summary.settledStake,
    summary.settledPayout,
    1,
  )
  const lines = [
    { label: '累计投入', value: summary.totalStake, color: 'var(--accent)' },
    { label: '完赛成本', value: summary.settledStake, color: 'var(--text)' },
    { label: '完赛奖金', value: summary.settledPayout, color: 'var(--green)' },
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
