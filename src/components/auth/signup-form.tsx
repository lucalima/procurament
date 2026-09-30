'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

import { FormField, invalidProps } from '@/components/forms/form-field'
import { SubmitButton } from '@/components/forms/submit-button'
import { Input } from '@/components/ui/input'
import { signupSchema, type SignupFormValues } from '@/lib/schemas/auth'

export function SignupForm() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({ resolver: zodResolver(signupSchema) })

  const onSubmit = async (values: SignupFormValues) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: string
        code?: string
      } | null
      const message = body?.error ?? 'We could not create your account.'
      setError(body?.code === 'org_name_taken' ? 'orgName' : 'email', {
        message,
      })
      return
    }
    // The new PM is signed in; the middleware sends them to onboarding.
    router.replace('/onboarding')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <FormField
        id="orgName"
        label="Organisation name"
        required
        error={errors.orgName?.message}
      >
        <Input
          id="orgName"
          autoComplete="organization"
          {...invalidProps('orgName', errors.orgName?.message)}
          {...register('orgName')}
        />
      </FormField>
      <FormField
        id="fullName"
        label="Full name"
        required
        error={errors.fullName?.message}
      >
        <Input
          id="fullName"
          autoComplete="name"
          {...invalidProps('fullName', errors.fullName?.message)}
          {...register('fullName')}
        />
      </FormField>
      <FormField
        id="email"
        label="Work email"
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
      <SubmitButton
        pending={isSubmitting}
        pendingLabel="Creating your account"
        size="lg"
        className="w-full"
      >
        Create Account
      </SubmitButton>
      <p className="text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
