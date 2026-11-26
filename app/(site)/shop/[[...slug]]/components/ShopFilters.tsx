"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Search, SlidersHorizontal, MapPin, ChevronRight } from "lucide-react"
import { useDebouncedCallback } from "use-debounce"
import { GenericCategory } from "@/lib/generic-api"
import { shopHrefFor } from "@/lib/categories"

export const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low → high" },
  { value: "price-desc", label: "Price: high → low" },
  { value: "rating", label: "Top rated" },
] as const

export function ShopHeaderFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const query = searchParams.get("q") || ""
  const sort = searchParams.get("sort") || "featured"

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams)
    if (term) {
      params.set("q", term)
    } else {
      params.delete("q")
    }
    router.push(`${pathname}?${params.toString()}`)
  }, 300)

  return (
    <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center">
      <div className="group relative flex w-full max-w-4xl flex-1 items-center rounded-full bg-white p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-1 ring-border transition-all focus-within:shadow-[0_8px_30px_rgb(0,0,0,0.12)] focus-within:ring-2 focus-within:ring-brand/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div className="flex flex-1 items-center pl-5 pr-2">
          <Search className="h-5 w-5 text-brand" />
          <Input
            defaultValue={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search for phones, fashion, properties..."
            className="h-12 w-full bg-transparent pl-4 pr-4 text-base font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground border-none shadow-none outline-none focus-visible:ring-0 focus-visible:border-none"
          />
        </div>
        <Button variant="ghost" type="button" className="hidden h-12 rounded-full bg-gradient-to-r from-brand to-brand-deep px-8 font-bold tracking-wide text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg sm:block">
          Search
        </Button>
      </div>

      <div className="relative w-full md:w-[220px]">
        <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Select
          value={sort}
          onValueChange={(value) => {
            const params = new URLSearchParams(searchParams)
            params.set("sort", value)
            router.push(`${pathname}?${params.toString()}`)
          }}
        >
          <SelectTrigger className="h-14 w-full rounded-full border-0 bg-white pl-12 pr-6 text-sm font-medium shadow-[0_4px_20px_rgb(0,0,0,0.04)] ring-1 ring-border transition-all focus:ring-2 focus:ring-brand/40 hover:ring-brand/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
  PRICE_CEIL,
  PRICE_FLOOR,
  PRICE_STOPS,
  formatNairaShort,
  parsePriceRange,
  stopIndexFor,
} from "@/lib/price-range"

type PriceRange = [min: number, max: number]

/** Order the bounds and clamp them to the slider's floor/ceiling. */
function normalizeRange([a, b]: PriceRange): PriceRange {
  const clamp = (n: number) => Math.min(Math.max(Math.round(n), PRICE_FLOOR), PRICE_CEIL)
  const lo = clamp(Math.min(a, b))
  const hi = clamp(Math.max(a, b))
  return [lo, hi]
}

function describeRange([lo, hi]: PriceRange): string {
  const hasMin = lo > PRICE_FLOOR
  const hasMax = hi < PRICE_CEIL
  if (hasMin && hasMax) return `${formatNairaShort(lo)} – ${formatNairaShort(hi)}`
  if (hasMin) return `${formatNairaShort(lo)}+`
  if (hasMax) return `Up to ${formatNairaShort(hi)}`
  return "Any"
}

/** Typed amount → whole naira; an empty box means "no limit" on that side. */
function amountFrom(raw: string, fallback: number): number {
  if (raw.trim() === "") return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? Math.max(Math.round(n), PRICE_FLOOR) : fallback
}

/**
 * Min + max price filter. Dragging updates the labels live; the URL (and so the
 * server fetch) only changes when a drag is released or a typed value is applied
 * with Enter/blur. A bound at the floor/ceiling is dropped from the URL, and the
 * page resets to 1 so a narrower range never lands on an empty page.
 */
function PriceRangeFilter({ initialMin, initialMax }: { initialMin: number; initialMax: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [range, setRange] = useState<PriceRange>(() => normalizeRange([initialMin, initialMax]))
  const lastPushed = useRef<string | null>(null)

  const shown = normalizeRange(range)
  const active = shown[0] > PRICE_FLOOR || shown[1] < PRICE_CEIL

  const commit = useDebouncedCallback((next: PriceRange) => {
    const [lo, hi] = normalizeRange(next)
    const params = new URLSearchParams(searchParams.toString())
    if (lo > PRICE_FLOOR) params.set("min_price", String(lo))
    else params.delete("min_price")
    if (hi < PRICE_CEIL) params.set("max_price", String(hi))
    else params.delete("max_price")

    if (
      params.get("min_price") === searchParams.get("min_price") &&
      params.get("max_price") === searchParams.get("max_price")
    ) {
      return
    }
    params.delete("page")
    const qs = params.toString()
    // Enter followed by blur would otherwise push (and server-render) the same URL twice.
    if (qs === lastPushed.current) return
    lastPushed.current = qs
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, 300)

  const applyNow = (next: PriceRange) => {
    const normalized = normalizeRange(next)
    setRange(normalized)
    commit(normalized)
    commit.flush()
  }

  const applyOnEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      applyNow(range)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-deep">
          Price · <span className="text-foreground">{describeRange(shown)}</span>
        </p>
        {active && (
          <button
            type="button"
            onClick={() => applyNow([PRICE_FLOOR, PRICE_CEIL])}
            className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      <Slider
        className="mt-4"
        min={0}
        max={PRICE_STOPS.length - 1}
        step={1}
        minStepsBetweenThumbs={1}
        value={[stopIndexFor(shown[0]), stopIndexFor(shown[1])]}
        onValueChange={([a, b]) => setRange([PRICE_STOPS[a], PRICE_STOPS[b]])}
        onValueCommit={([a, b]) => commit([PRICE_STOPS[a], PRICE_STOPS[b]])}
        thumbLabels={["Minimum price", "Maximum price"]}
      />
      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
        <span>{formatNairaShort(PRICE_FLOOR)}</span>
        <span>{formatNairaShort(PRICE_CEIL)}+</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="relative block">
          <span className="sr-only">Minimum price in naira</span>
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₦</span>
          <Input
            type="number"
            inputMode="numeric"
            min={PRICE_FLOOR}
            step={1000}
            placeholder="No min"
            value={range[0] > PRICE_FLOOR ? range[0] : ""}
            onChange={(e) => setRange([amountFrom(e.target.value, PRICE_FLOOR), range[1]])}
            onBlur={() => applyNow(range)}
            onKeyDown={applyOnEnter}
            className="h-9 pl-6 text-xs"
          />
        </label>
        <label className="relative block">
          <span className="sr-only">Maximum price in naira</span>
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₦</span>
          <Input
            type="number"
            inputMode="numeric"
            min={PRICE_FLOOR}
            step={1000}
            placeholder="No max"
            value={range[1] < PRICE_CEIL ? range[1] : ""}
            onChange={(e) => setRange([range[0], amountFrom(e.target.value, PRICE_CEIL)])}
            onBlur={() => applyNow(range)}
            onKeyDown={applyOnEnter}
            className="h-9 pl-6 text-xs"
          />
        </label>
      </div>
    </div>
  )
}

interface ShopSidebarFiltersProps {
  categories: GenericCategory[]
  /** Slug of the category being viewed (deepest URL segment), if any. */
  activeSlug?: string
  /** Ancestor slugs root → viewed category; these branches render expanded. */
  trailSlugs: string[]
  totalListingsCount: number
}

/**
 * One node in the multi-level category filter. Branches on the active trail open
 * automatically; any branch can also be toggled with its chevron. Links keep the
 * department first and the node second, matching the header mega-menu.
 */
function CategoryFilterNode({
  node,
  rootSlug,
  depth,
  activeSlug,
  trailSlugs,
  onNavigate,
}: {
  node: GenericCategory
  rootSlug: string
  depth: number
  activeSlug?: string
  trailSlugs: string[]
  onNavigate: (href: string) => void
}) {
  const children = node.children ?? []
  const hasChildren = children.length > 0
  const inTrail = trailSlugs.includes(node.slug)
  const active = node.slug === activeSlug
  const [open, setOpen] = useState(inTrail)

  // Follow client-side navigation: open the branch once it joins the active trail.
  useEffect(() => {
    if (inTrail) setOpen(true)
  }, [inTrail])

  const isRoot = depth === 0
  return (
    <div>
      <div
        className={`flex items-center rounded-md transition-colors ${active
          ? "bg-brand-soft/30 font-medium text-brand-deep"
          : inTrail
            ? "text-foreground hover:bg-surface"
            : "text-muted-foreground hover:bg-surface hover:text-foreground"
          }`}
      >
        <button
          type="button"
          onClick={() => onNavigate(shopHrefFor(rootSlug, node.slug))}
          aria-current={active ? "page" : undefined}
          className={`flex min-w-0 flex-1 items-center justify-between gap-2 text-left ${isRoot ? "px-3 py-2 text-sm" : "px-3 py-1.5 text-xs"}`}
        >
          <span className="flex min-w-0 items-center gap-2">
            {isRoot && <span className="text-muted-foreground">•</span>}
            <span className={`truncate ${inTrail && !active ? "font-medium" : ""}`}>{node.name}</span>
          </span>
          <span className="flex-none text-[10px] text-muted-foreground">{node.listings_count || 0}</span>
        </button>
        {hasChildren && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? `Collapse ${node.name}` : `Expand ${node.name}`}
            aria-expanded={open}
            className="flex h-7 w-7 flex-none items-center justify-center rounded text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
          </button>
        )}
      </div>

      {hasChildren && open && (
        <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-2">
          {children.map((child) => (
            <CategoryFilterNode
              key={child.slug}
              node={child}
              rootSlug={rootSlug}
              depth={depth + 1}
              activeSlug={activeSlug}
              trailSlugs={trailSlugs}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FilterContent({
  categories,
  activeSlug,
  trailSlugs,
  totalListingsCount,
  router,
  initialMinPrice,
  initialMaxPrice,
}: any) {
  return (
    <div className="space-y-7">
      <div className="hidden lg:block">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold">
          <SlidersHorizontal className="h-4 w-4 text-brand" /> Filters
        </h3>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-deep">Categories</p>
        <div className="mt-3 flex flex-col gap-1">
          <Button variant="ghost" type="button"
            onClick={() => router.push("/shop")}
            className={`flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${!activeSlug
              ? "bg-brand-soft/30 font-medium text-brand-deep"
              : "text-muted-foreground hover:bg-surface hover:text-foreground"
              }`}
          >
            <span>All categories</span>
            <span className="text-[10px] text-muted-foreground">{totalListingsCount}</span>
          </Button>
          {(categories as GenericCategory[]).map((c) => (
            <CategoryFilterNode
              key={c.slug}
              node={c}
              rootSlug={c.slug}
              depth={0}
              activeSlug={activeSlug}
              trailSlugs={trailSlugs ?? []}
              onNavigate={(href) => router.push(href)}
            />
          ))}
        </div>
      </div>

      {/* Keyed on the URL range so back/forward and "Clear" re-seed the local state. */}
      <PriceRangeFilter key={`${initialMinPrice}-${initialMaxPrice}`} initialMin={initialMinPrice} initialMax={initialMaxPrice} />

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-deep">
          <MapPin className="h-3.5 w-3.5" /> Location
        </p>
        <p className="mt-2 text-xs text-muted-foreground">Banex Mall · Same-hour rider delivery citywide</p>
      </div>
    </div>
  )
}

export function ShopSidebarFilters(props: ShopSidebarFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const urlRange = parsePriceRange(searchParams.get("min_price"), searchParams.get("max_price"))

  const contentProps = {
    ...props,
    router,
    initialMinPrice: Math.max(urlRange.min ?? PRICE_FLOOR, PRICE_FLOOR),
    initialMaxPrice: Math.min(urlRange.max ?? PRICE_CEIL, PRICE_CEIL),
  }

  return (
    <>
      <div className="lg:hidden mb-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" type="button" className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-3.5 text-sm font-semibold shadow-soft hover:bg-surface">
              <SlidersHorizontal className="h-4 w-4 text-brand" /> Filter listings
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-[340px] overflow-y-auto pt-10 pb-6 px-4">
            <SheetHeader className="mb-6 text-left">
              <SheetTitle className="font-display text-xl font-bold flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-brand" /> Filters
              </SheetTitle>
            </SheetHeader>
            <FilterContent {...contentProps} />
          </SheetContent>
        </Sheet>
      </div>
      <aside className="hidden lg:block">
        <FilterContent {...contentProps} />
      </aside>
    </>
  )
}
