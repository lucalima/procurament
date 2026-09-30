import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Fragment } from 'react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

const MAX_LEVELS = 4

/**
 * Breadcrumb bar between the top bar and page content (Content Guidelines
 * §5.4). Renders only for pages two or more levels deep; beyond four levels
 * the middle crumbs collapse to an ellipsis.
 */
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  if (items.length < 2) return null

  const visible: (BreadcrumbItem | 'ellipsis')[] =
    items.length > MAX_LEVELS
      ? [items[0]!, 'ellipsis', ...items.slice(-(MAX_LEVELS - 2))]
      : items

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex h-10 items-center border-b border-border bg-muted/40 px-8"
    >
      <ol className="flex min-w-0 items-center gap-1.5">
        {visible.map((item, i) => {
          const last = i === visible.length - 1
          return (
            <Fragment
              key={item === 'ellipsis' ? 'ellipsis' : `${i}-${item.label}`}
            >
              {i > 0 && (
                <ChevronRight
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
              <li className="min-w-0 truncate">
                {item === 'ellipsis' ? (
                  <span className="text-sm text-muted-foreground">…</span>
                ) : last || !item.href ? (
                  <span
                    className={
                      last
                        ? 'text-sm font-medium text-foreground'
                        : 'text-sm text-muted-foreground'
                    }
                    aria-current={last ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
