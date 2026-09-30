import { AlertCircle } from 'lucide-react'
import type { ReactNode } from 'react'

import { Label } from '@/components/ui/label'

/**
 * Label + control + helper/error text, per Content Guidelines §6.2. Give the
 * control `aria-invalid` and `aria-describedby={errorId(id)}` when invalid.
 */
export function FormField({
  id,
  label,
  required = false,
  error,
  helper,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string | undefined
  helper?: string
  children: ReactNode
}) {
  return (
    <div>
      <Label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-foreground"
      >
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error ? (
        <p
          id={errorId(id)}
          role="alert"
          className="mt-1.5 flex items-center gap-1 text-xs text-destructive"
        >
          <AlertCircle className="size-3 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : (
        helper && (
          <p className="mt-1.5 text-xs text-muted-foreground">{helper}</p>
        )
      )}
    </div>
  )
}

export function errorId(id: string) {
  return `${id}-error`
}

/** aria props for a control whose field may be showing an error. */
export function invalidProps(id: string, error: string | undefined) {
  return error
    ? ({ 'aria-invalid': true, 'aria-describedby': errorId(id) } as const)
    : {}
}
