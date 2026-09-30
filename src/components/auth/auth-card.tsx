import type { ReactNode } from 'react'

/** Centred card used by every auth and onboarding screen. */
export function AuthCard({
  title,
  description,
  children,
  wide = false,
}: {
  title: string
  description?: ReactNode
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div className={wide ? 'w-full max-w-2xl' : 'w-full max-w-md'}>
      <div className="mb-8 flex items-center justify-center gap-2">
        <span className="font-heading text-2xl text-primary">PM</span>
        <span className="font-heading text-2xl text-foreground">
          ProcureMaster
        </span>
      </div>
      <div className="rounded border border-border bg-card p-6 shadow-sm">
        <h1 className="font-heading text-4xl text-card-foreground">{title}</h1>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}
