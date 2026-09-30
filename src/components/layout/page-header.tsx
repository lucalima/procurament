import type { ReactNode } from 'react'

/** Page title row + rule used at the top of every shell page (Content Guidelines §5.5). */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-8 border-b border-border pb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-foreground">{title}</h1>
          {description && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
    </div>
  )
}

/** Standard page padding and max width (Content Guidelines §4.1). */
export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-7xl px-8 py-8">{children}</div>
}
