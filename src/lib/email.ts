import { render } from '@react-email/components'
import type { ReactElement } from 'react'
import { Resend } from 'resend'

/**
 * Renders a React Email template and sends it through Resend (Tech Stack §9).
 * Server-only. Returns whether the email was sent; callers decide whether a
 * failure matters.
 *
 * Without RESEND_API_KEY (local development before keys are configured) the
 * email is skipped and `devLink` is printed to the server console so the flow
 * can still be tested.
 */
export async function sendEmail({
  to,
  subject,
  template,
  devLink,
}: {
  to: string
  subject: string
  template: ReactElement
  devLink?: string
}): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(
        `[email] RESEND_API_KEY/RESEND_FROM_EMAIL not set; skipped "${subject}" to ${to}.` +
          (devLink ? ` Link: ${devLink}` : '')
      )
    }
    return { sent: false }
  }

  try {
    const html = await render(template)
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to,
      subject,
      html,
    })
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[email] Resend rejected the email', error.message)
      return { sent: false }
    }
    return { sent: true }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[email] sending failed', err)
    return { sent: false }
  }
}

export function appUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return new URL(path, base).toString()
}
