type DogMarkProps = {
  className?: string
  compact?: boolean
}

export function DogMark({ className = '', compact = false }: DogMarkProps) {
  return (
    <div className={`dog-mark ${className}`} aria-label="柴犬、可卡犬与拉布拉多">
      <svg
        viewBox="0 0 136 42"
        role="img"
        aria-hidden="true"
        className={compact ? 'h-7 w-[91px]' : 'h-10 w-[130px]'}
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
          <path d="M96 17c2-7 8-11 15-11s13 4 15 11v9c0 7-6 11-15 11s-15-4-15-11Z" />
          <path d="M98 17c-6 2-7 8-4 15 1 3 4 5 7 4m27-19c6 2 7 8 4 15-1 3-4 5-7 4" />
          <path d="M105 22h1m10 0h1m-9 7c2 1 5 1 7 0" />
          <path d="M110 25h2" />
        </g>
      </svg>
    </div>
  )
}
