'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { FormField, invalidProps } from '@/components/forms/form-field'
import { SubmitButton } from '@/components/forms/submit-button'
import { Input } from '@/components/ui/input'
import {
  setPasswordSchema,
  type SetPasswordFormValues,
} from '@/lib/schemas/auth'
import { createClient } from '@/lib/supabase/client'

type LinkType = 'recovery' | 'invite'
type Stage = 'verifying' | 'ready' | 'expired'

/**
 * Verifies a password-reset or team-invite link (token hash from the email
 * template), then lets the user choose a password.
 */
export function SetPasswordForm({
  tokenHash,
  type,
}: {
  tokenHash: string
  type: LinkType
}) {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('verifying')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const verified = useRef(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetPasswordFormValues>({
    resolver: zodResolver(setPasswordSchema),
  })

  useEffect(() => {
    // Tokens are single-use: guard against React strict mode's double effect.
    if (verified.current) return
    verified.current = true
    createClient()
      .auth.verifyOtp({ type, token_hash: tokenHash })
      .then(({ error }) => setStage(error ? 'expired' : 'ready'))
  }, [tokenHash, type])

  const onSubmit = async ({ password }: SetPasswordFormValues) => {
    setSubmitError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setSubmitError(
        error.code === 'same_password'
          ? 'Choose a password different from your current one.'
          : 'We could not update your password. Please try again.'
      )
      return
    }

    if (type === 'invite') {
      // Invited team members are signed in and go straight to their dashboard.
      router.replace('/dashboard')
      router.refresh()
      return
    }
    await supabase.auth.signOut()
    router.replace('/login?notice=password-updated')
  }

  if (stage === 'verifying') {
    return (
      <p
        className="flex items-center gap-2 text-sm text-muted-foreground"
        role="status"
      >
        <Loader2
          className="size-4 animate-spin text-primary"
          aria-hidden="true"
        />
        Checking your link…
      </p>
    )
  }

  if (stage === 'expired') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-foreground">
          This link has expired. Request a new one.
        </p>
        <Link href="/login" className="text-sm text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <FormField
        id="password"
        label="New Password"
        required
        helper="At least 8 characters."
        error={errors.password?.message}
      >
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...invalidProps('password', errors.password?.message)}
          {...register('password')}
        />
      </FormField>
      <FormField
        id="confirmPassword"
        label="Confirm Password"
        required
        error={errors.confirmPassword?.message ?? submitError ?? undefined}
      >
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...invalidProps(
            'confirmPassword',
            errors.confirmPassword?.message ?? submitError ?? undefined
          )}
          {...register('confirmPassword')}
        />
      </FormField>
      <SubmitButton
        pending={isSubmitting}
        pendingLabel="Saving password"
        size="lg"
        className="w-full"
      >
        Set Password
      </SubmitButton>
    </form>
  )
}
