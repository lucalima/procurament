'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

/**
 * Resolves a design-token CSS variable (stored as bare HSL components) to a
 * colour string for chart libraries, re-reading it when the theme changes
 * (Content Guidelines §9: never hardcode chart colours).
 */
export function useCssColor(
  variable: `--${string}`,
  fallback = 'currentColor'
) {
  const { resolvedTheme } = useTheme()
  const [color, setColor] = useState(fallback)

  useEffect(() => {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(variable)
      .trim()
    setColor(value ? `hsl(${value})` : fallback)
  }, [variable, fallback, resolvedTheme])

  return color
}
