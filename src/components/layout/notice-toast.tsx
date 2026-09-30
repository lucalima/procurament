'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

const NOTICES: Record<string, () => void> = {
  forbidden: () =>
    toast.error('You do not have permission to access that page.', {
      id: 'forbidden',
    }),
}

/**
 * Shows a toast for a ?notice= set by a middleware redirect, then removes it
 * from the URL so a refresh does not repeat it.
 */
export function NoticeToast() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const notice = params.get('notice')

  useEffect(() => {
    if (!notice || !NOTICES[notice]) return
    NOTICES[notice]()
    const next = new URLSearchParams(params)
    next.delete('notice')
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [notice, params, pathname, router])

  return null
}
