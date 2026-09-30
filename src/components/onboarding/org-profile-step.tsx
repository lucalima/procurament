'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

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
import { CURRENCIES } from '@/lib/constants'
import { orgProfileSchema, type OrgProfileFormValues } from '@/lib/schemas/auth'
import { createClient } from '@/lib/supabase/client'

/** Step 1: organisation name, optional logo, default currency. */
export function OrgProfileStep({
  orgId,
  defaults,
  onNext,
  onSkip,
}: {
  orgId: string
  defaults: OrgProfileFormValues
  onNext: (savedName: string) => void
  onSkip: () => void
}) {
  const [logo, setLogo] = useState<File | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OrgProfileFormValues>({
    resolver: zodResolver(orgProfileSchema),
    defaultValues: defaults,
  })

  const onSubmit = async (values: OrgProfileFormValues) => {
    setSaveError(null)
    const supabase = createClient()

    let logoPath: string | undefined
    if (logo) {
      const ext = logo.name.split('.').pop()?.toLowerCase() || 'png'
      logoPath = `${orgId}/logo.${ext}`
      const { error } = await supabase.storage
        .from('org-assets')
        .upload(logoPath, logo, { upsert: true, contentType: logo.type })
      if (error) {
        setLogoError('The logo could not be uploaded. Try a different image.')
        return
      }
    }

    const { error } = await supabase
      .from('organisations')
      .update({
        name: values.name,
        currency: values.currency,
        ...(logoPath ? { logo_url: logoPath } : {}),
      })
      .eq('id', orgId)
    if (error) {
      setSaveError('Your changes could not be saved. Please try again.')
      return
    }
    onNext(values.name)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <FormField
        id="name"
        label="Organisation name"
        required
        error={errors.name?.message ?? saveError ?? undefined}
      >
        <Input
          id="name"
          {...invalidProps(
            'name',
            errors.name?.message ?? saveError ?? undefined
          )}
          {...register('name')}
        />
      </FormField>
      <FormField
        id="logo"
        label="Logo"
        helper="Optional. Shown in the sidebar and on reports."
        error={logoError ?? undefined}
      >
        <Input
          id="logo"
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          {...invalidProps('logo', logoError ?? undefined)}
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null
            setLogoError(
              file && !file.type.startsWith('image/')
                ? 'Choose an image file.'
                : null
            )
            setLogo(file && file.type.startsWith('image/') ? file : null)
          }}
        />
      </FormField>
      <FormField
        id="currency"
        label="Default currency"
        required
        error={errors.currency?.message}
      >
        <Controller
          control={control}
          name="currency"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>
      <div className="flex items-center justify-between pt-6">
        <Button
          type="button"
          variant="link"
          className="h-auto p-0"
          onClick={onSkip}
        >
          Set up later
        </Button>
        <SubmitButton pending={isSubmitting} pendingLabel="Saving">
          Next
        </SubmitButton>
      </div>
    </form>
  )
}
