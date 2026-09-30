'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'

import { FormField, invalidProps } from '@/components/forms/form-field'
import { SubmitButton } from '@/components/forms/submit-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { INVITABLE_ROLES, MAX_ONBOARDING_INVITES } from '@/lib/constants'
import { inviteTeamSchema, type InviteTeamFormValues } from '@/lib/schemas/auth'

type InviteResult = { email: string; status: 'sent' | 'failed'; error?: string }

/** Step 2: repeatable email + role rows (max 10), or skip. */
export function InviteTeamStep({
  onDone,
  onSkip,
}: {
  onDone: (sent: number) => void
  onSkip: () => void
}) {
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InviteTeamFormValues>({
    resolver: zodResolver(inviteTeamSchema),
    defaultValues: { invites: [{ email: '', role: 'department_head' }] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'invites' })

  const onSubmit = async (values: InviteTeamFormValues) => {
    setRowErrors({})
    const res = await fetch('/api/auth/invite-team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const body = (await res.json().catch(() => null)) as {
      sent?: number
      results?: InviteResult[]
      error?: string
    } | null

    const failed = body?.results?.filter((r) => r.status === 'failed') ?? []
    if (failed.length === 0 && res.ok) {
      onDone(body?.sent ?? values.invites.length)
      return
    }
    setRowErrors(
      Object.fromEntries(
        failed.map((r) => [r.email, r.error ?? 'The invite could not be sent.'])
      )
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {fields.map((field, index) => {
        const emailId = `invites.${index}.email`
        const emailError =
          errors.invites?.[index]?.email?.message ??
          rowErrors[field.email] ??
          undefined
        return (
          <div key={field.id} className="flex items-start gap-3">
            <div className="flex-1">
              <FormField
                id={emailId}
                label="Email address"
                required
                error={emailError}
              >
                <Input
                  id={emailId}
                  type="email"
                  {...invalidProps(emailId, emailError)}
                  {...register(`invites.${index}.email`)}
                />
              </FormField>
            </div>
            <div className="w-48">
              <FormField id={`invites.${index}.role`} label="Role" required>
                <Controller
                  control={control}
                  name={`invites.${index}.role`}
                  render={({ field: roleField }) => (
                    <Select
                      value={roleField.value}
                      onValueChange={roleField.onChange}
                    >
                      <SelectTrigger id={`invites.${index}.role`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INVITABLE_ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-7"
              title="Remove this invite"
              aria-label="Remove this invite"
              disabled={fields.length === 1}
              onClick={() => remove(index)}
            >
              <Trash2 />
            </Button>
          </div>
        )
      })}

      {fields.length < MAX_ONBOARDING_INVITES && (
        <Button
          type="button"
          variant="link"
          className="h-auto p-0"
          onClick={() => append({ email: '', role: 'department_head' })}
        >
          <Plus />
          Add another
        </Button>
      )}

      <div className="flex items-center justify-between pt-6">
        <Button
          type="button"
          variant="link"
          className="h-auto p-0"
          onClick={onSkip}
        >
          Skip for now
        </Button>
        <SubmitButton pending={isSubmitting} pendingLabel="Sending invites">
          Send Invites and Continue
        </SubmitButton>
      </div>
    </form>
  )
}
