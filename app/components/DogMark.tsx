type DogMarkProps = {
  className?: string
  compact?: boolean
}

export function DogMark({ className = '', compact = false }: DogMarkProps) {
  return (
    <div className={`dog-mark ${className}`} aria-label="柴犬与可卡犬">
      <svg
        viewBox="0 0 92 42"
        role="img"
        aria-hidden="true"
        className={compact ? 'h-7 w-[62px]' : 'h-10 w-[88px]'}
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        >
          <path d="M8 18 11 7l8 7c3-2 7-2 10 0l8-7 3 11c1 8-5 16-15 16S7 27 8 18Z" />
          <path d="M17 21c2 1 4 1 6 0m5 0c2 1 4 1 6 0M22 26c2 2 5 2 7 0" />
          <path d="M25 23h1" />
          <path d="M53 17c2-7 7-10 14-10s12 3 14 10v9c0 6-6 10-14 10s-14-4-14-10Z" />
          <path d="M55 16c-5 0-7 5-5 12 1 4 4 6 7 5m22-17c5 0 7 5 5 12-1 4-4 6-7 5" />
          <path d="M61 22h1m10 0h1m-10 6c3 2 6 2 9 0" />
          <path d="M66 25h2" />
        </g>
      </svg>
    </div>
  )
}

