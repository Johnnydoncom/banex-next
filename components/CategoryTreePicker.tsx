"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronRight, Check, Search, FolderTree } from "lucide-react"
import type { CategoryNode } from "@/lib/categories"
import { Input } from "@/components/ui/input"

type Node = CategoryNode & { listings_count?: number }

/** Ancestor id path to a node (inclusive), or null if not found. */
function pathIds(nodes: Node[] | undefined, id: string, acc: string[] = []): string[] | null {
  for (const n of nodes ?? []) {
    const next = [...acc, n.id]
    if (n.id === id) return next
    const found = pathIds(n.children as Node[] | undefined, id, next)
    if (found) return found
  }
  return null
}

function nameFor(nodes: Node[], id: string): string | undefined {
  for (const n of nodes) {
    if (n.id === id) return n.name
    const c = n.children && nameFor(n.children as Node[], id)
    if (c) return c
  }
  return undefined
}

/**
 * Visual, expandable category tree for picking a product's category.
 * Handles arbitrary nesting depth (roots → children → grandchildren …).
 * Any node is selectable; the chevron expands/collapses branches.
 */
export function CategoryTreePicker({
  nodes,
  value,
  onChange,
  disabled = false,
  placeholder = "Select a category",
}: {
  nodes: Node[]
  value: string
  onChange: (id: string) => void
  disabled?: boolean
  placeholder?: string
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState("")

  // Expand the ancestors of the selected node so it's visible in context.
  useEffect(() => {
    if (!value) return
    const path = pathIds(nodes, value)
    if (path) setExpanded((prev) => new Set([...prev, ...path.slice(0, -1)]))
  }, [value, nodes])

  // Search: keep a node when it (or a descendant) matches; auto-expand branches
  // that only match via a descendant.
  const q = query.trim().toLowerCase()
  const { show, autoExpand } = useMemo(() => {
    if (!q) return { show: null as Set<string> | null, autoExpand: null as Set<string> | null }
    const show = new Set<string>()
    const autoExpand = new Set<string>()
    const walk = (n: Node): boolean => {
      const selfMatch = n.name.toLowerCase().includes(q)
      let childMatch = false
      for (const c of (n.children as Node[] | undefined) ?? []) if (walk(c)) childMatch = true
      if (selfMatch || childMatch) {
        show.add(n.id)
        if (childMatch) autoExpand.add(n.id)
      }
      return selfMatch || childMatch
    }
    nodes.forEach(walk)
    return { show, autoExpand }
  }, [q, nodes])

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const selectedPath = value ? pathIds(nodes, value) : null
  const selectedName = value ? nameFor(nodes, value) : undefined

  const renderNodes = (list: Node[], depth: number) =>
    list.map((n) => {
      if (show && !show.has(n.id)) return null
      const kids = (n.children as Node[] | undefined) ?? []
      const hasKids = kids.length > 0
      const isOpen = expanded.has(n.id) || (autoExpand?.has(n.id) ?? false)
      const isSelected = value === n.id
      return (
        <div key={n.id}>
          <div
            className={`flex items-center gap-1 rounded-lg pr-2 transition-colors ${
              isSelected ? "bg-brand/10 text-brand-deep" : "hover:bg-surface/60"
            }`}
            style={{ paddingLeft: `${depth * 16 + 4}px` }}
          >
            {hasKids ? (
              <button
                type="button"
                onClick={() => toggle(n.id)}
                aria-label={isOpen ? "Collapse" : "Expand"}
                className="flex h-6 w-6 flex-none items-center justify-center rounded text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-90" : ""}`} />
              </button>
            ) : (
              <span className="h-6 w-6 flex-none" />
            )}
            <button
              type="button"
              onClick={() => onChange(n.id)}
              className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left text-sm"
            >
              <span
                className={`flex h-4 w-4 flex-none items-center justify-center rounded-full border ${
                  isSelected ? "border-brand bg-brand text-primary-foreground" : "border-border"
                }`}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </span>
              <span className={`truncate ${isSelected ? "font-semibold" : ""}`}>{n.name}</span>
              {typeof n.listings_count === "number" && (
                <span className="ml-auto flex-none text-[10px] tabular-nums text-muted-foreground">{n.listings_count}</span>
              )}
            </button>
          </div>
          {hasKids && isOpen && <div>{renderNodes(kids, depth + 1)}</div>}
        </div>
      )
    })

  if (disabled) {
    return (
      <div className="rounded-xl border border-border bg-surface/40 px-4 py-6 text-center text-xs text-muted-foreground">
        {placeholder}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Selected breadcrumb */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs">
        <FolderTree className="h-3.5 w-3.5 flex-none text-brand" />
        {selectedPath && selectedName ? (
          <span className="min-w-0 truncate">
            {selectedPath.map((id, i) => (
              <span key={id}>
                {i > 0 && <span className="mx-1 text-muted-foreground">/</span>}
                <span className={i === selectedPath.length - 1 ? "font-semibold text-foreground" : "text-muted-foreground"}>
                  {nameFor(nodes, id)}
                </span>
              </span>
            ))}
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </div>

      {/* Search */}
      <div className="relative border-b border-border p-2">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search categories…"
          className="h-8 rounded-lg pl-8 text-xs"
        />
      </div>

      {/* Tree */}
      <div className="max-h-72 overflow-y-auto p-1.5">
        {nodes.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">No categories available.</p>
        ) : show && show.size === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">No matches for “{query}”.</p>
        ) : (
          renderNodes(nodes, 0)
        )}
      </div>
    </div>
  )
}
