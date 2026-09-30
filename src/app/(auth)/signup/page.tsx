import type { Metadata } from 'next'

import { AuthCard } from '@/components/auth/auth-card'
import { SignupForm } from '@/components/auth/signup-form'

export const metadata: Metadata = { title: 'Create account · ProcureMaster' }

/** Creates a new organisation with its Procurement Manager (App Flow §1 /signup). */
export default function SignupPage() {
  return (
    <AuthCard
      title="Create your workspace"
      description="Set up ProcureMaster for your organisation. You will be its Procurement Manager."
    >
      <SignupForm />
    </AuthCard>
  )
}
