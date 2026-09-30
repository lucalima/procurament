import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthCard } from '@/components/auth/auth-card'
import { ResetRequestForm } from '@/components/auth/reset-request-form'

export const metadata: Metadata = { title: 'Reset password · ProcureMaster' }

export default function ResetPasswordRequestPage() {
  return (
    <AuthCard
      title="Reset password"
      description="Enter your email and we will send you a link to set a new password."
    >
      <ResetRequestForm />
      <p className="mt-6 text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  )
}
