'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { FormField, invalidProps } from '@/components/forms/form-field'
import { SubmitButton } from '@/components/forms/submit-button'
import { Input } from '@/components/ui/input'
import {
  resetRequestSchema,
  type ResetRequestFormValues,
} from '@/lib/schemas/auth'
import { createClient } from '@/lib/supabase/client'

/**
 * Requests a password reset email. Always reports success, whether or not the
 * email exists (App Flow §3, security).
 */
export function ResetRequestForm({
  defaultEmail = '',
}: {
  defaultEmail?: string
}) {
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetRequestFormValues>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: { email: defaultEmail },
  })

  const onSubmit = async ({ email }: ResetRequestFormValues) => {
    // The recovery email template links to /reset-password/{token_hash}.
    await createClient().auth.resetPasswordForEmail(email)
    setSent(true)
  }

  if (sent) {
    return (
      <p
        className="flex items-start gap-2 text-sm text-foreground"
        role="status"
      >
        <CheckCircle2
          className="mt-0.5 size-4 shrink-0 text-green-500"
          aria-hidden="true"
        />
        If an account exists for that email, a reset link is on its way. The
        link is valid for 60 minutes.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <FormField
        id="reset-email"
        label="Email"
        required
        error={errors.email?.message}
      >
        <Input
          id="reset-email"
          type="email"
          autoComplete="email"
          {...invalidProps('reset-email', errors.email?.message)}
          {...register('email')}
        />
      </FormField>
      <SubmitButton
        pending={isSubmitting}
        pendingLabel="Sending reset link"
        className="w-full"
      >
        Send Reset Link
      </SubmitButton>
    </form>
  )
}
