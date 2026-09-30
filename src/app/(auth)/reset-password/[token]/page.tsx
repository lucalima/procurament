import type { Metadata } from 'next'

import { AuthCard } from '@/components/auth/auth-card'
import { SetPasswordForm } from '@/components/auth/set-password-form'

export const metadata: Metadata = { title: 'Set password · ProcureMaster' }

/**
 * Target of the password-reset email and, with ?type=invite, of the team
 * invite email (both templates live in supabase/templates/).
 */
export default function SetPasswordPage({
  params,
  searchParams,
}: {
  params: { token: string }
  searchParams: { type?: string }
}) {
  const type = searchParams.type === 'invite' ? 'invite' : 'recovery'

  return (
    <AuthCard
      title={
        type === 'invite' ? 'Welcome to ProcureMaster' : 'Set a new password'
      }
      description={
        type === 'invite'
          ? 'You have been invited to join your team. Choose a password to get started.'
          : 'Choose a new password for your account.'
      }
    >
      <SetPasswordForm tokenHash={params.token} type={type} />
    </AuthCard>
  )
}
