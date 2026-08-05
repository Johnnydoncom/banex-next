import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

/**
 * URL-based pagination for server components. Renders <Link>s so each page is a
 * fresh SSR render (SEO-friendly, shareable, back/forward works). Pass a
 * `hrefForPage` that preserves the page's other query params.
 */
export function Pagination({
  currentPage,
  lastPage,
  hrefForPage,
  total,
  perPage,
  className = "",
}: {
  currentPage: number
  lastPage: number
  hrefForPage: (page: number) => string
  total?: number
  perPage?: number
  className?: string
}) {
  if (lastPage <= 1) return null

  const page = Math.min(Math.max(currentPage, 1), lastPage)

  // Windowed page numbers: 1 … (p-1) p (p+1) … last
  const pages: (number | "…")[] = []
  const push = (n: number | "…") => pages.push(n)
  const window = 1
  const start = Math.max(2, page - window)
  const end = Math.min(lastPage - 1, page + window)
  push(1)
  if (start > 2) push("…")
  for (let i = start; i <= end; i++) push(i)
  if (end < lastPage - 1) push("…")
  if (lastPage > 1) push(lastPage)

  const base =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors"
  const idle = "border-border bg-card text-foreground hover:border-brand hover:text-brand"
  const active = "border-brand bg-brand text-primary-foreground pointer-events-none"
  const disabled = "border-border bg-surface text-muted-foreground/40 pointer-events-none"

  const rangeStart = total && perPage ? (page - 1) * perPage + 1 : undefined
  const rangeEnd = total && perPage ? Math.min(page * perPage, total) : undefined

  return (
    <nav
      aria-label="Pagination"
      className={`mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row ${className}`}
    >
      {total !== undefined && rangeStart !== undefined && (
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{rangeStart}–{rangeEnd}</span> of{" "}
          <span className="font-semibold text-foreground">{total}</span>
        </p>
      )}

      <div className="flex items-center gap-1.5">
        {page > 1 ? (
          <Link href={hrefForPage(page - 1)} rel="prev" aria-label="Previous page" className={`${base} ${idle}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        ) : (
          <span className={`${base} ${disabled}`} aria-disabled>
            <ChevronLeft className="h-4 w-4" />
          </span>
        )}

        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-1 text-sm text-muted-foreground">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={hrefForPage(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              className={`${base} ${p === page ? active : idle}`}
            >
              {p}
            </Link>
          ),
        )}

        {page < lastPage ? (
          <Link href={hrefForPage(page + 1)} rel="next" aria-label="Next page" className={`${base} ${idle}`}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className={`${base} ${disabled}`} aria-disabled>
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </nav>
  )
}

/** Build a query string from a params object, dropping empty values. */
export function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ""
}
