import { Loader2 } from 'lucide-react'

import { Button, type ButtonProps } from '@/components/ui/button'

/** Button whose label is replaced by a spinner while pending (Content Guidelines §6.1). */
export function SubmitButton({
  pending,
  pendingLabel,
  children,
  disabled,
  ...props
}: ButtonProps & { pending: boolean; pendingLabel: string }) {
  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          <span className="sr-only">{pendingLabel}</span>
        </>
      ) : (
        children
      )}
    </Button>
  )
}
