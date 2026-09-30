'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { FormField, invalidProps } from '@/components/forms/form-field'
import { SubmitButton } from '@/components/forms/submit-button'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/lib/api/client'
import { useInviteVendor } from '@/lib/queries/rfps'
import {
  vendorInviteSchema,
  type VendorInviteFormValues,
  type VendorInviteInput,
} from '@/lib/schemas/vendor-invite'

const EMPTY: VendorInviteFormValues = {
  email: '',
  companyName: '',
  personalMessage: '',
}

/** Invite Vendor modal (App Flow §4). */
export function InviteVendorDialog({
  rfpId,
  open,
  onOpenChange,
}: {
  rfpId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const invite = useInviteVendor(rfpId)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VendorInviteFormValues, unknown, VendorInviteInput>({
    resolver: zodResolver(vendorInviteSchema),
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (open) reset(EMPTY)
  }, [open, reset])

  const onSubmit = async (values: VendorInviteInput) => {
    try {
      const { emailSent } = await invite.mutateAsync(values)
      if (emailSent) {
        toast.success(`Invite sent to ${values.email}`)
      } else {
        toast.warning(
          `Invite created for ${values.email}, but the email could not be sent.`
        )
      }
      onOpenChange(false)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Could not send the invite.'
      setError('email', { message })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Vendor</DialogTitle>
          <DialogDescription>
            The vendor receives a secure link, valid for 72 hours, to submit
            their proposal.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-5"
        >
          <FormField
            id="vendor-email"
            label="Vendor email"
            required
            error={errors.email?.message}
          >
            <Input
              id="vendor-email"
              type="email"
              {...invalidProps('vendor-email', errors.email?.message)}
              {...register('email')}
            />
          </FormField>
          <FormField
            id="vendor-company"
            label="Vendor company name"
            required
            error={errors.companyName?.message}
          >
            <Input
              id="vendor-company"
              {...invalidProps('vendor-company', errors.companyName?.message)}
              {...register('companyName')}
            />
          </FormField>
          <FormField
            id="vendor-message"
            label="Personal message"
            helper="Optional. Included in the invite email."
            error={errors.personalMessage?.message}
          >
            <Textarea
              id="vendor-message"
              {...invalidProps(
                'vendor-message',
                errors.personalMessage?.message
              )}
              {...register('personalMessage')}
            />
          </FormField>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <SubmitButton pending={isSubmitting} pendingLabel="Sending invite">
              Send Invite
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
