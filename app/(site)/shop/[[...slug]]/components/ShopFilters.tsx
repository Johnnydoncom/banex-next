"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Search, SlidersHorizontal, MapPin } from "lucide-react"
import { useDebouncedCallback } from "use-debounce"
import { GenericCategory, GenericSeller } from "@/lib/generic-api"
import { VendorSidebar } from "@/components/VendorSidebar"

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
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          defaultValue={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search anything…"
          className="h-11 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm outline-none shadow-sm transition-all placeholder:text-muted-foreground focus:border-brand focus:ring-4 focus:ring-brand/10 hover:border-brand/50"
        />
      </div>
      <select
        value={sort}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams)
          params.set("sort", e.target.value)
          router.push(`${pathname}?${params.toString()}`)
        }}
        className="h-11 w-full sm:w-[160px] rounded-full border border-border bg-card px-4 text-sm outline-none shadow-sm transition-all focus:border-brand focus:ring-4 focus:ring-brand/10 hover:border-brand/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-[right_16px_center] bg-no-repeat pr-10"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  )
}

import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet"

interface ShopSidebarFiltersProps {
  categories: GenericCategory[]
  sellers: GenericSeller[]
  categorySlug: string
  subcategorySlug: string
  totalListingsCount: number
}

function FilterContent({
  categories,
  sellers,
  categorySlug,
  subcategorySlug,
  totalListingsCount,
  searchParams,
  router,
  pathname,
  maxPrice,
  vendorSlug,
  handlePriceChange
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
          <button
            onClick={() => router.push("/shop")}
            className={`flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
              categorySlug === "all"
                ? "bg-brand-soft/30 font-medium text-brand-deep"
                : "text-muted-foreground hover:bg-surface hover:text-foreground"
            }`}
          >
            <span>All categories</span>
            <span className="text-[10px] text-muted-foreground">{totalListingsCount}</span>
          </button>
          {categories.map((c: any) => {
            const count = c.listings_count || 0
            const active = categorySlug === c.slug
            return (
              <button
                key={c.slug}
                onClick={() => router.push(`/shop/${c.slug}`)}
                className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  active
                    ? "bg-brand-soft/30 font-medium text-brand-deep"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground">•</span>
                  {c.name}
                </span>
                <span className="text-[10px] text-muted-foreground">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-deep">
          Max price ·{" "}
          <span className="text-foreground">
            {new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency: "NGN",
              maximumFractionDigits: 0,
            }).format(maxPrice)}
          </span>
        </p>
        <input
          type="range"
          min={5000}
          max={20_000_000}
          step={5000}
          defaultValue={maxPrice}
          onChange={(e) => handlePriceChange(Number(e.target.value))}
          className="mt-3 w-full accent-[var(--brand)]"
        />
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>₦5k</span>
          <span>₦20m</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-deep">
          <MapPin className="h-3.5 w-3.5" /> Location
        </p>
        <p className="mt-2 text-xs text-muted-foreground">Banex Mall · Same-hour rider delivery citywide</p>
      </div>

      <VendorSidebar
        sellers={sellers}
        selectedSlug={vendorSlug}
        onSelect={(slug) => {
          const params = new URLSearchParams(searchParams)
          if (slug) params.set("vendor", slug)
          else params.delete("vendor")
          router.push(`${pathname}?${params.toString()}`)
        }}
        filterCategory={categorySlug !== "all" ? categorySlug : undefined}
      />
    </div>
  )
}

export function ShopSidebarFilters(props: ShopSidebarFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const maxPrice = Number(searchParams.get("max_price")) || 20_000_000
  const vendorSlug = searchParams.get("vendor") || undefined

  const handlePriceChange = useDebouncedCallback((price: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("max_price", price.toString())
    router.push(`${pathname}?${params.toString()}`)
  }, 300)

  const contentProps = {
    ...props,
    searchParams,
    router,
    pathname,
    maxPrice,
    vendorSlug,
    handlePriceChange
  }

  return (
    <>
      <div className="lg:hidden mb-6">
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-3.5 text-sm font-semibold shadow-soft hover:bg-surface">
              <SlidersHorizontal className="h-4 w-4 text-brand" /> Filter listings
            </button>
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
