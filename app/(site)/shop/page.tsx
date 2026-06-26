"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useMemo, useState, useEffect, Suspense } from "react"
import { Search, SlidersHorizontal, MapPin } from "lucide-react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProductCard } from "@/components/ProductCard"
import { products, formatNaira } from "@/lib/products"
import { categories, getCategory } from "@/lib/categories"
import { VendorSidebar } from "@/components/VendorSidebar"
import { vendors } from "@/lib/vendors"

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low → high" },
  { value: "price-desc", label: "Price: high → low" },
  { value: "rating", label: "Top rated" },
] as const

function ShopContent() {
  const searchParams = useSearchParams()
  const initialQ = searchParams.get("q") || ""
  const initialCategory = searchParams.get("category") || "all"
  const initialSubcategory = searchParams.get("subcategory") || "all"

  const [query, setQuery] = useState(initialQ)
  const [categorySlug, setCategorySlug] = useState<string>(initialCategory)
  const [subcategorySlug, setSubcategorySlug] = useState<string>(initialSubcategory)
  const [vendorSlug, setVendorSlug] = useState<string | undefined>(undefined)
  const [maxPrice, setMaxPrice] = useState<number>(20_000_000)
  const [sort, setSort] = useState<(typeof SORTS)[number]["value"]>("featured")

  // Update states if URL search params change
  useEffect(() => {
    setQuery(searchParams.get("q") || "")
    setCategorySlug(searchParams.get("category") || "all")
    setSubcategorySlug(searchParams.get("subcategory") || "all")
  }, [searchParams])

  const activeCategory = categorySlug !== "all" ? getCategory(categorySlug) : undefined
  const activeVendor = vendorSlug ? vendors.find((v) => v.slug === vendorSlug) : undefined

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const matchQ =
        !query ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.brand.toLowerCase().includes(query.toLowerCase())
      const matchC = categorySlug === "all" || p.categorySlug === categorySlug
      const matchSC = subcategorySlug === "all" || p.subcategorySlug === subcategorySlug
      const matchV = !activeVendor || activeVendor.productSlugs.includes(p.slug)
      const lowest = Math.min(...p.sellers.map((s) => s.price))
      const matchP = lowest <= maxPrice
      return matchQ && matchC && matchSC && matchV && matchP
    })
    const lowestOf = (p: (typeof products)[number]) => Math.min(...p.sellers.map((s) => s.price))
    if (sort === "price-asc") list = [...list].sort((a, b) => lowestOf(a) - lowestOf(b))
    if (sort === "price-desc") list = [...list].sort((a, b) => lowestOf(b) - lowestOf(a))
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating)
    return list
  }, [query, categorySlug, subcategorySlug, activeVendor, maxPrice, sort])

  return (
    <div className="min-h-screen">
      <Header />

      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
          <nav className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span>›</span>
            <Link href="/shop" className="hover:text-brand">Marketplace</Link>
            {activeCategory && (
              <>
                <span>›</span>
                <span className="text-foreground">{activeCategory.name}</span>
              </>
            )}
          </nav>

          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-brand-deep">Marketplace</p>
          <h1 className="mt-1 font-display text-3xl font-bold md:text-5xl">
            {activeCategory ? activeCategory.name : "All listings"}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {products.length} listings · {products.reduce((acc, p) => acc + p.sellers.length, 0)} verified seller offers · across Nigeria
          </p>

          <div className="mt-6 flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search anything…"
                className="h-12 w-full rounded-full border border-border bg-background pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-brand"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="h-12 rounded-full border border-border bg-background px-5 text-sm outline-none focus:border-brand"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Subcategory chips */}
          {activeCategory && (
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => setSubcategorySlug("all")}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  subcategorySlug === "all"
                    ? "bg-gradient-brand text-primary-foreground"
                    : "border border-border bg-card text-muted-foreground hover:border-brand hover:text-brand"
                }`}
              >
                All {activeCategory.name}
              </button>
              {activeCategory.subcategories.map((sc) => (
                <button
                  key={sc.slug}
                  onClick={() => setSubcategorySlug(sc.slug)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    subcategorySlug === sc.slug
                      ? "bg-gradient-brand text-primary-foreground"
                      : "border border-border bg-card text-muted-foreground hover:border-brand hover:text-brand"
                  }`}
                >
                  {sc.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        {activeVendor && (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-brand/40 bg-brand-soft/15 p-4 text-sm">
            <img src={activeVendor.avatar} alt={activeVendor.name} className="h-10 w-10 rounded-lg object-cover" />
            <div className="flex-1">
              <p className="font-display text-sm font-semibold">Showing {activeVendor.name}'s shop</p>
              <p className="text-xs text-muted-foreground">{activeVendor.floor} floor · Stall {activeVendor.stall} · {activeVendor.deliveryMins}min rider</p>
            </div>
            <Link href={`/vendor/${activeVendor.slug}`} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-brand hover:text-brand">
              Open storefront
            </Link>
            <button onClick={() => setVendorSlug(undefined)} className="text-xs font-medium text-brand hover:underline">Clear</button>
          </div>
        )}
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-7">
            <div>
              <h3 className="flex items-center gap-2 font-display text-base font-semibold">
                <SlidersHorizontal className="h-4 w-4 text-brand" /> Filters
              </h3>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-deep">Categories</p>
              <div className="mt-3 flex flex-col gap-1">
                <button
                  onClick={() => { setCategorySlug("all"); setSubcategorySlug("all") }}
                  className={`flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    categorySlug === "all"
                      ? "bg-brand-soft/30 font-medium text-brand-deep"
                      : "text-muted-foreground hover:bg-surface hover:text-foreground"
                  }`}
                >
                  <span>All categories</span>
                  <span className="text-[10px] text-muted-foreground">{products.length}</span>
                </button>
                {categories.map((c) => {
                  const count = products.filter((p) => p.categorySlug === c.slug).length
                  const Icon = c.icon
                  const active = categorySlug === c.slug
                  return (
                     <button
                      key={c.slug}
                      onClick={() => { setCategorySlug(c.slug); setSubcategorySlug("all") }}
                      className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        active
                          ? "bg-brand-soft/30 font-medium text-brand-deep"
                          : "text-muted-foreground hover:bg-surface hover:text-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${active ? "text-brand" : "text-muted-foreground"}`} />
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
                Max price · <span className="text-foreground">{formatNaira(maxPrice)}</span>
              </p>
              <input
                type="range"
                min={5000}
                max={20_000_000}
                step={5000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
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
              <p className="mt-2 text-xs text-muted-foreground">
                Banex Mall · Same-hour rider delivery citywide
              </p>
            </div>

            <VendorSidebar
              selectedSlug={vendorSlug}
              onSelect={setVendorSlug}
              filterCategory={categorySlug}
            />
          </aside>

          <div>
            <p className="mb-5 text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {products.length}
            </p>
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
                <p className="font-display text-2xl font-semibold">Nothing matches</p>
                <p className="mt-2 text-sm text-muted-foreground">Try a different search or widen your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
                {filtered.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default function Shop() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <ShopContent />
    </Suspense>
  )
}
