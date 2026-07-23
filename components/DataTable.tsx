"use client"

import { useState, useMemo } from "react"
import { Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type Column<T> = {
  key: string
  label: string
  sortable?: boolean
  className?: string
  render: (row: T) => React.ReactNode
}

type DataTableProps<T> = {
  columns: Column<T>[]
  data: T[]
  /** Unique key for each row */
  rowKey: (row: T) => string
  /** Placeholder for the search box */
  searchPlaceholder?: string
  /** Client-side search filter — receives (row, query) → boolean */
  searchFilter?: (row: T, query: string) => boolean
  /** Number of rows per page (default 10) */
  pageSize?: number
  /** Render a mobile-friendly card for each row instead of a table row */
  mobileCard?: (row: T) => React.ReactNode
  /** Empty state component */
  emptyState?: React.ReactNode
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DataTable<T>({
  columns,
  data,
  rowKey,
  searchPlaceholder = "Search…",
  searchFilter,
  pageSize = 10,
  mobileCard,
  emptyState,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(0)

  /* Filter */
  const filtered = useMemo(() => {
    if (!query.trim() || !searchFilter) return data
    return data.filter((row) => searchFilter(row, query.trim().toLowerCase()))
  }, [data, query, searchFilter])

  /* Sort */
  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const av = (a as any)[sortKey]
      const bv = (b as any)[sortKey]
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = typeof av === "string" ? av.localeCompare(bv) : av - bv
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  /* Paginate */
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize)

  /* Reset page on filter */
  const handleSearch = (v: string) => {
    setQuery(v)
    setPage(0)
  }

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const SortIcon = ({ col }: { col: string }) => {
    if (sortKey !== col) return <ChevronsUpDown className="ml-1 inline h-3 w-3 opacity-40" />
    return sortDir === "asc" ? (
      <ChevronUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ChevronDown className="ml-1 inline h-3 w-3" />
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      {searchFilter && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="data-table-search"
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
      )}

      {/* Empty state */}
      {sorted.length === 0 ? (
        emptyState ?? (
          <div className="py-12 text-center text-sm text-muted-foreground">No results found.</div>
        )
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/60">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground ${col.className ?? ""}`}
                    >
                      {col.sortable ? (
                        <Button variant="ghost" type="button"
                          onClick={() => toggleSort(col.key)}
                          className="inline-flex items-center hover:text-foreground"
                        >
                          {col.label}
                          <SortIcon col={col.key} />
                        </Button>
                      ) : (
                        col.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paged.map((row) => (
                  <tr key={rowKey(row)} className="transition-colors hover:bg-surface/40">
                    {columns.map((col) => (
                      <td key={col.key} className={`px-4 py-3.5 ${col.className ?? ""}`}>
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {paged.map((row) =>
              mobileCard ? (
                <div key={rowKey(row)}>{mobileCard(row)}</div>
              ) : (
                <div key={rowKey(row)} className="rounded-2xl border border-border bg-card p-4 space-y-2">
                  {columns.map((col) => (
                    <div key={col.key} className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">{col.label}</span>
                      <span className="text-right text-sm">{col.render(row)}</span>
                    </div>
                  ))}
                </div>
              ),
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of{" "}
                {sorted.length}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="ghost" type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-surface disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-xs font-medium">
                  {page + 1} / {totalPages}
                </span>
                <Button variant="ghost" type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-surface disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
