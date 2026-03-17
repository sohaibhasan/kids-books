'use client'

const STEP_LABELS = ['Child', 'Genre', 'Theme', 'World', 'Style', 'Review']

interface ProgressBarProps {
  current: number
  total: number
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-3">
        {STEP_LABELS.slice(0, total).map((label, i) => {
          const step = i + 1
          const done = step < current
          const active = step === current
          return (
            <div key={label} className="flex flex-col items-center gap-1 flex-1">
              {/* Connector line */}
              <div className="flex items-center w-full">
                {i > 0 && (
                  <div className={`flex-1 h-1 rounded-full ${step <= current ? 'bg-primary' : 'bg-ink/10'}`} />
                )}
                <div
                  className={`
                    w-8 h-8 rounded-full border-4 flex items-center justify-center font-bold text-sm flex-shrink-0
                    ${done ? 'bg-primary border-primary text-white'
                    : active ? 'bg-accent border-ink text-ink'
                    : 'bg-white border-ink/20 text-ink/30'}
                  `}
                >
                  {done ? '✓' : step}
                </div>
                {i < total - 1 && (
                  <div className={`flex-1 h-1 rounded-full ${step < current ? 'bg-primary' : 'bg-ink/10'}`} />
                )}
              </div>
              <span className={`text-xs font-semibold ${active ? 'text-ink' : 'text-ink/40'}`}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
