'use client'

import { LogOut, Moon, User } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from 'next-themes'

import { UserAvatar } from '@/components/layout/user-avatar'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'

/**
 * Avatar dropdown (App Flow §2.4): name and email, My Account, Sign Out.
 * Internal users also get the dark mode toggle; vendors get Sign Out only.
 */
export function UserMenu({
  name,
  email,
  avatarUrl = null,
  variant = 'internal',
}: {
  name: string
  email: string
  avatarUrl?: string | null
  variant?: 'internal' | 'vendor'
}) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Account menu"
      >
        <UserAvatar name={name} src={avatarUrl} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {variant === 'internal' && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/account">
                <User className="size-4" aria-hidden="true" />
                My Account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuCheckboxItem
              checked={resolvedTheme === 'dark'}
              onCheckedChange={(on) => setTheme(on ? 'dark' : 'light')}
            >
              <Moon className="mr-2 size-4" aria-hidden="true" />
              Dark mode
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onSelect={() => createClient().auth.signOut()}>
          <LogOut className="size-4" aria-hidden="true" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
