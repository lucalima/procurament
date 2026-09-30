import { z } from 'zod'

import { CURRENCIES, MAX_ONBOARDING_INVITES } from '@/lib/constants'

const email = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Enter a valid email address')

const newPassword = z.string().min(8, 'Password must be at least 8 characters')

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
})
export type LoginFormValues = z.infer<typeof loginSchema>

export const signupSchema = z.object({
  orgName: z.string().trim().min(2, 'Organisation name is required').max(100),
  fullName: z.string().trim().min(1, 'Full name is required').max(100),
  email,
  password: newPassword,
})
export type SignupFormValues = z.infer<typeof signupSchema>

export const resetRequestSchema = z.object({ email })
export type ResetRequestFormValues = z.infer<typeof resetRequestSchema>

export const setPasswordSchema = z
  .object({
    password: newPassword,
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
export type SetPasswordFormValues = z.infer<typeof setPasswordSchema>

export const orgProfileSchema = z.object({
  name: z.string().trim().min(2, 'Organisation name is required').max(100),
  currency: z.enum(CURRENCIES),
})
export type OrgProfileFormValues = z.infer<typeof orgProfileSchema>

export const teamInviteSchema = z.object({
  email,
  role: z.enum(['department_head', 'finance_approver']),
})

export const inviteTeamSchema = z.object({
  invites: z
    .array(teamInviteSchema)
    .min(1, 'Add at least one invite')
    .max(
      MAX_ONBOARDING_INVITES,
      `You can invite up to ${MAX_ONBOARDING_INVITES} people at once`
    ),
})
export type InviteTeamFormValues = z.infer<typeof inviteTeamSchema>
