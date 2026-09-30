'use client'

import { CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { AuthCard } from '@/components/auth/auth-card'
import { SubmitButton } from '@/components/forms/submit-button'
import { InviteTeamStep } from '@/components/onboarding/invite-team-step'
import { OnboardingProgress } from '@/components/onboarding/onboarding-progress'
import { OrgProfileStep } from '@/components/onboarding/org-profile-step'
import type { OrgProfileFormValues } from '@/lib/schemas/auth'

type Step = 1 | 2 | 3

const TITLES: Record<Step, { title: string; description: string }> = {
  1: {
    title: 'Set up your organisation',
    description:
      'Tell us about your company. You can change this later in Settings.',
  },
  2: {
    title: 'Invite your team',
    description:
      'Invite Department Heads and Finance Approvers to your workspace.',
  },
  3: {
    title: 'Your workspace is ready',
    description: 'Here is what you set up.',
  },
}

/** Three-step first-login wizard for the Procurement Manager (App Flow §3.1). */
export function OnboardingWizard({
  orgId,
  org,
  initialStep,
  initialInvited,
}: {
  orgId: string
  org: OrgProfileFormValues
  initialStep: Step
  initialInvited: number
}) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(initialStep)
  const [orgName, setOrgName] = useState(org.name)
  const [invited, setInvited] = useState(initialInvited)
  const [finishing, setFinishing] = useState(false)
  const [finishError, setFinishError] = useState<string | null>(null)

  // Keep ?step= in the URL so the documented routes (/onboarding?step=N) work.
  const goTo = (next: Step, sent = invited) => {
    setStep(next)
    const qs = next === 3 && sent ? `?step=3&invited=${sent}` : `?step=${next}`
    router.replace(`/onboarding${qs}`, { scroll: false })
  }

  const finish = async () => {
    setFinishing(true)
    setFinishError(null)
    const res = await fetch('/api/auth/onboarding/complete', {
      method: 'PATCH',
    })
    if (!res.ok) {
      setFinishing(false)
      setFinishError('Something went wrong. Please try again.')
      return
    }
    router.replace('/dashboard')
    router.refresh()
  }

  const { title, description } = TITLES[step]

  return (
    <AuthCard title={title} description={description} wide>
      <OnboardingProgress step={step} />

      {step === 1 && (
        <OrgProfileStep
          orgId={orgId}
          defaults={org}
          onNext={(savedName) => {
            setOrgName(savedName)
            goTo(2)
          }}
          onSkip={() => goTo(3)}
        />
      )}

      {step === 2 && (
        <InviteTeamStep
          onDone={(sent) => {
            setInvited(sent)
            goTo(3, sent)
          }}
          onSkip={() => goTo(3)}
        />
      )}

      {step === 3 && (
        <div>
          <ul className="space-y-3 text-sm text-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2
                className="size-4 text-green-500"
                aria-hidden="true"
              />
              Organisation: <span className="font-medium">{orgName}</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2
                className="size-4 text-green-500"
                aria-hidden="true"
              />
              Invites sent: <span className="font-medium">{invited}</span>
            </li>
          </ul>
          {finishError && (
            <p role="alert" className="mt-4 text-xs text-destructive">
              {finishError}
            </p>
          )}
          <div className="flex justify-end pt-6">
            <SubmitButton
              type="button"
              pending={finishing}
              pendingLabel="Opening your dashboard"
              onClick={finish}
            >
              Go to Dashboard
            </SubmitButton>
          </div>
        </div>
      )}
    </AuthCard>
  )
}
