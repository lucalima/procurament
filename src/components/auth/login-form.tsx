'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { ResetRequestForm } from '@/components/auth/reset-request-form'
import { FormField, invalidProps } from '@/components/forms/form-field'
import { SubmitButton } from '@/components/forms/submit-button'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { homePathFor, readAppClaims } from '@/lib/auth/claims'
import { loginSchema, type LoginFormValues } from '@/lib/schemas/auth'
import { createClient } from '@/lib/supabase/client'

const DISABLED_MESSAGE =
  'Your account has been disabled. Contact your administrator.'

/** Only follow same-site relative paths after sign-in. */
function safeNext(next: string | undefined) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null
}

export function LoginForm({
  next,
  notice,
}: {
  next?: string | undefined
  notice?: string | undefined
}) {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(
    notice === 'disabled' ? DISABLED_MESSAGE : null
  )
  const [resetOpen, setResetOpen] = useState(false)
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  useEffect(() => {
    // Fixed ids stop the toast repeating when the effect runs twice.
    if (notice === 'password-updated') {
      toast.success('Password updated — please sign in', { id: notice })
    } else if (notice === 'session-expired') {
      toast.error('Your session has expired. Please sign in again.', {
        id: notice,
      })
    }
  }, [notice])

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword(values)
    if (error) {
      setFormError('Invalid email or password')
      return
    }

    const { data } = await supabase.auth.getClaims()
    const claims = readAppClaims(data?.claims)
    if (!claims) {
      await supabase.auth.signOut()
      setFormError(DISABLED_MESSAGE)
      return
    }

    router.replace(safeNext(next) ?? homePathFor(claims))
    router.refresh()
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormField
          id="email"
          label="Email"
          required
          error={errors.email?.message}
        >
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...invalidProps('email', errors.email?.message)}
            {...register('email')}
          />
        </FormField>
        <FormField
          id="password"
          label="Password"
          required
          error={errors.password?.message ?? formError ?? undefined}
        >
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...invalidProps(
              'password',
              errors.password?.message ?? formError ?? undefined
            )}
            {...register('password')}
          />
        </FormField>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-sm"
            onClick={() => setResetOpen(true)}
          >
            Forgot password?
          </Button>
        </div>
        <SubmitButton
          pending={isSubmitting}
          pendingLabel="Signing in"
          size="lg"
          className="w-full"
        >
          Sign In
        </SubmitButton>
      </form>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              Reset your password
            </DialogTitle>
            <DialogDescription>
              Enter your email and we will send you a link to set a new
              password.
            </DialogDescription>
          </DialogHeader>
          {/* Remount on each open so the success state resets */}
          {resetOpen && <ResetRequestForm defaultEmail={getValues('email')} />}
        </DialogContent>
      </Dialog>
    </>
  )
}
