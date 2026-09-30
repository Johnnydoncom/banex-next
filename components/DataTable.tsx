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
  /** Row selection (opt-in) — pass both to render a checkbox per row. */
  selectedKeys?: Set<string>
  onSelectionChange?: (keys: Set<string>) => void
  /** Plural noun used in the selection hints (default "rows"). */
  selectionLabel?: string
}

/* Native checkbox so the header can show the indeterminate (some selected) state. */
function SelectBox({
  checked,
  indeterminate = false,
  onChange,
  label,
  className = "",
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: (checked: boolean) => void
  label: string
  className?: string
}) {
  return (
    <input
      type="checkbox"
      ref={(el) => {
        if (el) el.indeterminate = indeterminate
      }}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={label}
      className={`h-4 w-4 flex-none cursor-pointer rounded accent-brand ${className}`}
    />
  )
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
  selectedKeys,
  onSelectionChange,
  selectionLabel = "rows",
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

  /* Paginate — clamp so a shrinking list (tab change, deletions) never strands
     the table on a page that no longer exists. */
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const current = Math.min(page, totalPages - 1)
  const paged = sorted.slice(current * pageSize, (current + 1) * pageSize)

  /* Selection */
  const selectable = !!selectedKeys && !!onSelectionChange
  const selected = useMemo(() => selectedKeys ?? new Set<string>(), [selectedKeys])
  const pageKeys = paged.map(rowKey)
  const selectedOnPage = pageKeys.filter((k) => selected.has(k)).length
  const allOnPage = pageKeys.length > 0 && selectedOnPage === pageKeys.length
  const allInView = selectable && sorted.length > 0 && sorted.every((row) => selected.has(rowKey(row)))
  // Offer "select all N" once a whole page is ticked; confirm it once everything is.
  const selectionHint = (allOnPage && !allInView) || (allInView && totalPages > 1)

  const toggleRow = (key: string, checked: boolean) => {
    const next = new Set(selected)
    if (checked) next.add(key)
    else next.delete(key)
    onSelectionChange?.(next)
  }

  const togglePage = (checked: boolean) => {
    const next = new Set(selected)
    pageKeys.forEach((k) => (checked ? next.add(k) : next.delete(k)))
    onSelectionChange?.(next)
  }

  /* Reset page on filter */
  const handleSearch = (v: string) => {
    setQuery(v)
    setPage(0)
    // Rows hidden by the search are dropped from the selection, so a bulk action
    // only ever touches rows the user can still see.
    if (selectable && selected.size > 0) {
      const q = v.trim().toLowerCase()
      const visible = !q || !searchFilter ? data : data.filter((row) => searchFilter(row, q))
      const visibleKeys = new Set(visible.map(rowKey))
      const next = new Set(Array.from(selected).filter((k) => visibleKeys.has(k)))
      if (next.size !== selected.size) onSelectionChange?.(next)
    }
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
          {selectable && (
            <div
              className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground ${
                selectionHint ? "" : "md:hidden"
              }`}
            >
              {/* The header checkbox is hidden along with the <thead> on small screens. */}
              <label className="flex cursor-pointer items-center gap-2 font-medium md:hidden">
                <SelectBox
                  checked={allOnPage}
                  indeterminate={selectedOnPage > 0 && !allOnPage}
                  onChange={togglePage}
                  label="Select all on this page"
                />
                Select all on this page
              </label>
              {allOnPage && !allInView && (
                <span>
                  All {pageKeys.length} {selectionLabel} on this page are selected.{" "}
                  <button
                    type="button"
                    onClick={() => onSelectionChange?.(new Set(sorted.map(rowKey)))}
                    className="font-semibold text-brand hover:underline"
                  >
                    Select all {sorted.length} {selectionLabel}
                  </button>
                </span>
              )}
              {allInView && totalPages > 1 && (
                <span>
                  All {sorted.length} {selectionLabel} are selected.
                </span>
              )}
            </div>
          )}

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
                  {selectable && (
                    <th className="w-10 py-3 pl-4 text-left">
                      <SelectBox
                        checked={allOnPage}
                        indeterminate={selectedOnPage > 0 && !allOnPage}
                        onChange={togglePage}
                        label="Select all on this page"
                      />
                    </th>
                  )}
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
                {paged.map((row) => {
                  const key = rowKey(row)
                  const isSelected = selectable && selected.has(key)
                  return (
                    <tr
                      key={key}
                      className={`block overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-colors md:table-row md:rounded-none md:border-0 md:border-b md:border-border md:shadow-none md:last:border-b-0 ${
                        isSelected
                          ? "ring-1 ring-brand/60 md:bg-brand/5 md:ring-0"
                          : "md:bg-transparent md:hover:bg-surface/40"
                      }`}
                    >
                      {selectable && (
                        <td className="hidden w-10 py-3.5 pl-4 md:table-cell md:align-middle">
                          <SelectBox checked={isSelected} onChange={(c) => toggleRow(key, c)} label="Select row" />
                        </td>
                      )}
                      {columns.map((col, idx) =>
                        idx === 0 ? (
                          // Primary/identity column → full-width card header on mobile
                          <td
                            key={col.key}
                            className={`block border-b border-border/50 bg-surface/40 px-4 py-3 text-sm last:border-b-0 w-full max-w-sm md:table-cell md:border-0 md:bg-transparent md:py-3.5 md:align-middle ${col.className ?? ""}`}
                          >
                            {selectable ? (
                              <div className="flex items-center gap-3">
                                <SelectBox
                                  className="md:hidden"
                                  checked={isSelected}
                                  onChange={(c) => toggleRow(key, c)}
                                  label="Select row"
                                />
                                <div className="min-w-0 flex-1">{col.render(row)}</div>
                              </div>
                            ) : (
                              col.render(row)
                            )}
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
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Showing {current * pageSize + 1}–{Math.min((current + 1) * pageSize, sorted.length)} of{" "}
                {sorted.length}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="ghost" type="button"
                  disabled={current === 0}
                  onClick={() => setPage(current - 1)}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-surface disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-xs font-medium">
                  {current + 1} / {totalPages}
                </span>
                <Button variant="ghost" type="button"
                  disabled={current >= totalPages - 1}
                  onClick={() => setPage(current + 1)}
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
