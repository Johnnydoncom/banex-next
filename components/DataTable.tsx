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
          {/*
            Single responsive table (one DOM tree for all screen sizes).
            - md+  : renders as a normal table inside a bordered card.
            - < md : CSS `display` utilities restack each <tr> into its own card,
                     each <td> becomes a label/value row (label via ::before).
          */}
          <div className="md:overflow-x-auto md:rounded-2xl md:border md:border-border md:bg-card">
            <table className="block w-full text-sm md:table">
              <thead className="hidden md:table-header-group">
                <tr className="border-b border-border bg-surface/60">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground ${col.className ?? ""}`}
                    >
                      {col.sortable ? (
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={() => toggleSort(col.key)}
                          className="h-auto p-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-transparent hover:text-foreground"
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
              <tbody className="block space-y-3 md:table-row-group md:space-y-0">
                {paged.map((row) => (
                  <tr
                    key={rowKey(row)}
                    className="block overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-colors md:table-row md:rounded-none md:border-0 md:border-b md:border-border md:bg-transparent md:shadow-none md:last:border-b-0 md:hover:bg-surface/40"
                  >
                    {columns.map((col, idx) =>
                      idx === 0 ? (
                        // Primary/identity column → full-width card header on mobile
                        <td
                          key={col.key}
                          className={`block border-b border-border/50 bg-surface/40 px-4 py-3 text-sm last:border-b-0 max-w-sm md:table-cell md:border-0 md:bg-transparent md:py-3.5 md:align-middle ${col.className ?? ""}`}
                        >
                          {col.render(row)}
                        </td>
                      ) : (
                        // Remaining columns → label / value rows on mobile
                        <td
                          key={col.key}
                          data-label={col.label}
                          className={`flex items-center justify-between gap-3 border-b border-border/50 px-4 py-2.5 text-sm last:border-b-0 before:shrink-0 before:text-[11px] before:font-semibold before:uppercase before:tracking-wide before:text-muted-foreground before:content-[attr(data-label)] md:table-cell md:border-0 md:py-3.5 md:align-middle md:before:content-none ${col.className ?? ""}`}
                        >
                          {col.render(row)}
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
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
