import { NextResponse } from 'next/server'
import type { ZodError } from 'zod'

/** Consistent API error shape: { error, code } (Implementation Plan Phase 10). */
export function apiError(error: string, code: string, status: number) {
  return NextResponse.json({ error, code }, { status })
}

export function validationError(zodError: ZodError) {
  const first = zodError.issues[0]
  return apiError(first?.message ?? 'Invalid request', 'validation_error', 400)
}

export const unauthorized = () =>
  apiError('You must be signed in.', 'unauthorized', 401)

export const forbidden = () =>
  apiError('You do not have permission to do that.', 'forbidden', 403)
