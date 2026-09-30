'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { FormField, invalidProps } from '@/components/forms/form-field'
import { SubmitButton } from '@/components/forms/submit-button'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DEPARTMENTS } from '@/lib/constants'
import { useCreateRfp, useUpdateRfp } from '@/lib/queries/rfps'
import { rfpSchema, type RFPFormValues, type RFPInput } from '@/lib/schemas/rfp'
import type { Tables } from '@/types/database'

type EditableRfp = Pick<
  Tables<'rfps'>,
  | 'id'
  | 'title'
  | 'description'
  | 'department'
  | 'budget_min'
  | 'budget_max'
  | 'submission_deadline'
>

const EMPTY: RFPFormValues = {
  title: '',
  description: '',
  department: '' as RFPFormValues['department'],
  budgetMin: '',
  budgetMax: '',
  submissionDeadline: '',
}

function toFormValues(rfp: EditableRfp): RFPFormValues {
  return {
    title: rfp.title,
    description: rfp.description,
    department: rfp.department as RFPFormValues['department'],
    budgetMin: rfp.budget_min === null ? '' : String(rfp.budget_min),
    budgetMax: rfp.budget_max === null ? '' : String(rfp.budget_max),
    submissionDeadline: rfp.submission_deadline?.slice(0, 10) ?? '',
  }
}

/**
 * Create RFP modal (App Flow §4). With `rfp` it becomes the pre-filled
 * "Edit RFP" modal used on the RFP detail page.
 */
export function RfpFormDialog({
  open,
  onOpenChange,
  rfp,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  rfp?: EditableRfp
}) {
  const editing = Boolean(rfp)
  const create = useCreateRfp()
  const update = useUpdateRfp(rfp?.id ?? '')
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RFPFormValues, unknown, RFPInput>({
    resolver: zodResolver(rfpSchema),
    defaultValues: rfp ? toFormValues(rfp) : EMPTY,
  })

  // Fresh form every time the modal opens.
  useEffect(() => {
    if (open) reset(rfp ? toFormValues(rfp) : EMPTY)
  }, [open, rfp, reset])

  const onSubmit = async (values: RFPInput) => {
    try {
      if (editing) {
        await update.mutateAsync(values)
        toast.success('RFP updated')
      } else {
        await create.mutateAsync(values)
        toast.success('RFP created successfully')
      }
      onOpenChange(false)
    } catch (err) {
      setError('title', {
        message: err instanceof Error ? err.message : 'Could not save the RFP.',
      })
    }
  }

  const err = (key: keyof RFPFormValues) => errors[key]?.message

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit RFP' : 'Create RFP'}</DialogTitle>
          <DialogDescription>
            {editing
              ? 'Update the details of this procurement.'
              : 'Start a new procurement. You can invite vendors once it is created.'}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-5"
        >
          <FormField id="title" label="RFP Title" required error={err('title')}>
            <Input
              id="title"
              {...invalidProps('title', err('title'))}
              {...register('title')}
            />
          </FormField>
          <FormField
            id="description"
            label="Description"
            required
            error={err('description')}
          >
            <Textarea
              id="description"
              {...invalidProps('description', err('description'))}
              {...register('description')}
            />
          </FormField>
          <FormField
            id="department"
            label="Department"
            required
            error={err('department')}
          >
            <Controller
              control={control}
              name="department"
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="department"
                    {...invalidProps('department', err('department'))}
                  >
                    <SelectValue placeholder="Choose a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              id="budgetMin"
              label="Budget Min"
              error={err('budgetMin')}
            >
              <Input
                id="budgetMin"
                type="number"
                inputMode="decimal"
                min={0}
                {...invalidProps('budgetMin', err('budgetMin'))}
                {...register('budgetMin')}
              />
            </FormField>
            <FormField
              id="budgetMax"
              label="Budget Max"
              error={err('budgetMax')}
            >
              <Input
                id="budgetMax"
                type="number"
                inputMode="decimal"
                min={0}
                {...invalidProps('budgetMax', err('budgetMax'))}
                {...register('budgetMax')}
              />
            </FormField>
          </div>
          <FormField
            id="submissionDeadline"
            label="Submission Deadline"
            error={err('submissionDeadline')}
          >
            <Input
              id="submissionDeadline"
              type="date"
              {...invalidProps('submissionDeadline', err('submissionDeadline'))}
              {...register('submissionDeadline')}
            />
          </FormField>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <SubmitButton pending={isSubmitting} pendingLabel="Saving RFP">
              {editing ? 'Save Changes' : 'Create RFP'}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
