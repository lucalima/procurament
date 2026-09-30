import { z } from 'zod'

export const vendorInviteSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Vendor email is required')
    .email('Enter a valid email address'),
  companyName: z
    .string()
    .trim()
    .min(1, 'Vendor company name is required')
    .max(200),
  // Nullable so the parsed form output is also a valid API request body.
  personalMessage: z
    .string()
    .trim()
    .max(2000)
    .nullish()
    .transform((v) => (v ? v : null)),
})
export type VendorInviteFormValues = z.input<typeof vendorInviteSchema>
export type VendorInviteInput = z.output<typeof vendorInviteSchema>
