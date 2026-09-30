import type { Metadata } from 'next'

import { AuthCard } from '@/components/auth/auth-card'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = { title: 'Sign in · ProcureMaster' }

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string; notice?: string }
}) {
  return (
    <AuthCard
      title="Sign in"
      description="Welcome back. Sign in to your ProcureMaster workspace."
    >
      <LoginForm
        next={searchParams.next}
        notice={searchParams.error ?? searchParams.notice}
      />
    </AuthCard>
  )
}
