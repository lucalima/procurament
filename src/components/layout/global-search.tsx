'use client'

import { Search } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { Input } from '@/components/ui/input'
import { useAppStore } from '@/stores/useAppStore'

const CATEGORIES = ['RFPs', 'Vendors', 'Contracts'] as const

/**
 * Top bar search (App Flow §8.1). Typing opens the results overlay; the search
 * API is wired up later, so categories render empty for now.
 */
export function GlobalSearch() {
  const query = useAppStore((s) => s.globalSearchQuery)
  const setQuery = useAppStore((s) => s.setGlobalSearchQuery)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const trimmed = query.trim()

  return (
    <div ref={containerRef} className="relative w-80">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(e.target.value.trim().length > 0)
        }}
        onFocus={() => setOpen(trimmed.length > 0)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        placeholder="Search RFPs, vendors, contracts…"
        aria-label="Search RFPs, vendors, contracts"
        className="rounded-[4px] bg-muted pl-9"
      />
      {open && trimmed && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 rounded border border-border bg-popover shadow-md"
          role="listbox"
          aria-label="Search results"
        >
          {CATEGORIES.map((category) => (
            <div key={category} className="border-b border-border px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">
                {category}
              </p>
            </div>
          ))}
          <Link
            href={`/search?q=${encodeURIComponent(trimmed)}`}
            className="block px-4 py-3 text-sm text-primary hover:underline"
            onClick={() => setOpen(false)}
          >
            See all results for &lsquo;{trimmed}&rsquo;
          </Link>
        </div>
      )}
    </div>
  )
}
