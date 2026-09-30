import { z } from 'zod'

import { DEPARTMENTS } from '@/lib/constants'
import { Constants } from '@/types/database'

/** Optional money field from a form input: '' → null, otherwise a non-negative number. */
const money = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
  z
    .number({ invalid_type_error: 'Enter a number' })
    .nonnegative('Must be 0 or more')
    .nullable()
)

const baseRfp = z.object({
  title: z.string().trim().min(1, 'RFP title is required').max(200),
  description: z.string().trim().min(1, 'Description is required').max(5000),
  department: z.enum(DEPARTMENTS, {
    errorMap: () => ({ message: 'Choose a department' }),
  }),
  budgetMin: money,
  budgetMax: money,
  // yyyy-mm-dd from the date input; '' or null for no deadline. Nullable so
  // the parsed form output is also a valid API request body.
  submissionDeadline: z
    .string()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, 'Enter a valid date')
    .nullable()
    .transform((v) => (v === '' || v === null ? null : v)),
})

const budgetOrder = (v: {
  budgetMin: number | null
  budgetMax: number | null
}) => v.budgetMin === null || v.budgetMax === null || v.budgetMin <= v.budgetMax

export const rfpSchema = baseRfp.refine(budgetOrder, {
  message: 'Maximum must be at least the minimum',
  path: ['budgetMax'],
})
export type RFPFormValues = z.input<typeof rfpSchema>
export type RFPInput = z.output<typeof rfpSchema>

export const rfpStatusSchema = z.enum(Constants.public.Enums.rfp_status)

/** PATCH body: any subset of the form fields, or a status change. */
export const rfpUpdateSchema = baseRfp
  .partial()
  .extend({ status: rfpStatusSchema.optional() })
  .refine(
    (v) =>
      v.budgetMin === undefined ||
      v.budgetMax === undefined ||
      budgetOrder({ budgetMin: v.budgetMin, budgetMax: v.budgetMax }),
    { message: 'Maximum must be at least the minimum', path: ['budgetMax'] }
  )
export type RFPUpdate = z.output<typeof rfpUpdateSchema>
