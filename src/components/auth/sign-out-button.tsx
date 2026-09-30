'use client'

import { useState } from 'react'

import { Button, type ButtonProps } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

/** Signs out; AuthProvider then redirects to /login (App Flow §2.4). */
export function SignOutButton(props: ButtonProps) {
  const [pending, setPending] = useState(false)
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={async () => {
        setPending(true)
        await createClient().auth.signOut()
      }}
      {...props}
    >
      Sign Out
    </Button>
  )
}
