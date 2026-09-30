import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

const STEPS = ['Organisation profile', 'Invite team', 'Complete'] as const

/** Three-step progress indicator shown above the wizard (App Flow §3.1). */
export function OnboardingProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <ol
      className="mb-8 flex items-center gap-3"
      aria-label="Onboarding progress"
    >
      {STEPS.map((label, i) => {
        const n = i + 1
        const done = n < step
        const current = n === step
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                done && 'border-primary bg-primary text-primary-foreground',
                current && 'border-primary text-primary',
                !done && !current && 'border-border text-muted-foreground'
              )}
              aria-current={current ? 'step' : undefined}
            >
              {done ? <Check className="size-3.5" aria-hidden="true" /> : n}
            </span>
            <span
              className={cn(
                'text-sm',
                current
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {label}
            </span>
            {n < STEPS.length && (
              <span className="h-px flex-1 bg-border" aria-hidden="true" />
            )}
          </li>
        )
      })}
    </ol>
  )
}
