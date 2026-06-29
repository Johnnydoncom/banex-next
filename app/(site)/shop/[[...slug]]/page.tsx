import Link from "next/link"
import { Suspense } from "react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ApiProductCard } from "@/components/ApiProductCard"
import { ShopHeaderFilters, ShopSidebarFilters } from "./components/ShopFilters"
import { fetchGenericCategories, fetchGenericCategory, fetchGenericProducts, fetchGenericSeller, fetchGenericSellers, GenericCategory, GenericProduct, GenericSeller } from "@/lib/generic-api"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {
  const resolvedParams = await params
  const categorySlug = resolvedParams.slug?.[0]
  if (!categorySlug || categorySlug === "all") {
    return { title: "Marketplace | Banex Mall", description: "Shop all categories on Banex Mall" }
  }
  try {
    const category = await fetchGenericCategory(categorySlug)
    if (category) {
      return { title: `${category.name} | Banex Mall`, description: `Shop ${category.name} on Banex Mall` }
    }
  } catch (e) { }
  return { title: "Marketplace | Banex Mall" }
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  const slugArray = resolvedParams.slug
  const categorySlug = slugArray?.[0] || "all"
  const subcategorySlug = slugArray?.[1] || "all"

  // Ensure these are strings
  const q = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : undefined
  const sort = typeof resolvedSearchParams.sort === "string" ? resolvedSearchParams.sort : undefined
  const vendorParam = typeof resolvedSearchParams.vendor === "string" ? resolvedSearchParams.vendor : undefined
  const maxPriceParam = typeof resolvedSearchParams.max_price === "string" ? Number(resolvedSearchParams.max_price) : undefined

  // Fetch API data
  let categoriesData: any = {}
  let productsData: any = {}
  let sellersData: any = {}

  try {
    const [cData, sData] = await Promise.all([
      fetchGenericCategories(),
      fetchGenericSellers()
    ])
    categoriesData = cData || {}
    sellersData = sData || {}

    const sellers = sellersData.sellers || []
    const activeSellerId = vendorParam ? sellers.find((s: GenericSeller) => s.slug === vendorParam)?.id : undefined

    productsData = await fetchGenericProducts({
      q,
      category: categorySlug !== "all" ? categorySlug : undefined,
      seller_id: activeSellerId,
      sort,
      max_price: maxPriceParam,
    }) || {}
  } catch (e) {
    console.error("[shop] Failed to fetch data:", e)
  }

  const categories: GenericCategory[] = categoriesData.categories || []
  const sellers = sellersData.sellers || []
  const totalListingsCount = categoriesData.total_listings_count || 0

  // Actually, fetchGenericCategory doesn't need to be fetched if we just find it in categories array,
  // but if it has deeper details like subcategories, we might need it.
  const activeCategory = categorySlug !== "all" ? categories.find((c: GenericCategory) => c.slug === categorySlug) : undefined

  // Client side filtering handles max price locally in API param, but if API doesn't support max_price yet,
  // we do a quick local filter fallback on the server.
  let filteredProducts: GenericProduct[] = productsData.products || []
  if (maxPriceParam !== undefined) {
    filteredProducts = filteredProducts.filter((p: GenericProduct) => p.price <= maxPriceParam)
  }

  // Active vendor logic
  let activeVendor
  if (vendorParam) {
    try {
      const v = await fetchGenericSeller(vendorParam)
      activeVendor = v.seller
    } catch (e) { }
  }

  return (
    <div className="min-h-screen">
      <Header />

      <section className="relative overflow-hidden bg-white pt-10 pb-16 md:pt-16 md:pb-24 border-b border-border">
        {/* Very subtle, elegant background elements */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-soft/20 via-transparent to-transparent"></div>
        <div className="absolute -top-[20%] -left-[10%] z-0 h-[500px] w-[500px] rounded-full bg-brand/5 blur-[100px] pointer-events-none"></div>

        {activeCategory?.image_url && (
          <div className="absolute right-0 top-0 z-0 hidden h-full w-1/3 md:block">
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent z-10"></div>
            <img src={activeCategory.image_url} alt="" className="h-full w-full object-cover object-center opacity-40 mix-blend-multiply" />
          </div>
        )}

        <div className="relative z-10 mx-auto container">
          <nav className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Link href="/" className="hover:text-brand transition-colors">Home</Link>
            <span className="text-border">•</span>
            <Link href="/shop" className="hover:text-brand transition-colors">Marketplace</Link>
            {activeCategory && (
              <>
                <span className="text-border">•</span>
                <span className="text-brand font-bold">{activeCategory.name}</span>
              </>
            )}
          </nav>

          <div className="max-w-4xl">
            <h1 className="font-display text-5xl font-extrabold tracking-tight text-foreground md:text-6xl lg:text-7xl">
              {activeCategory ? activeCategory.name : "Marketplace"}
            </h1>
            <p className="mt-5 text-lg font-medium text-muted-foreground md:text-xl max-w-2xl">
              Discover <span className="font-bold text-foreground">{productsData.pagination?.total || filteredProducts.length}</span> verified listings across Nigeria. The best deals, curated for you.
            </p>

            <div className="mt-10">
              <Suspense fallback={<div className="h-16 w-full max-w-4xl animate-pulse rounded-full bg-surface" />}>
                <ShopHeaderFilters />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        {activeVendor && (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-brand/40 bg-brand-soft/15 p-4 text-sm">
            {activeVendor.cover_image_url && (
              <img src={activeVendor.cover_image_url} alt={activeVendor.shop_name} className="h-10 w-10 rounded-lg object-cover" />
            )}
            <div className="flex-1">
              <p className="font-display text-sm font-semibold">Showing {activeVendor.shop_name}'s shop</p>
              <p className="text-xs text-muted-foreground">{activeVendor.location || "Banex Mall"}</p>
            </div>
            <Link href={`/vendor/${activeVendor.slug}`} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-brand hover:text-brand">
              Open storefront
            </Link>
            <Link href="/shop" className="text-xs font-medium text-brand hover:underline">Clear</Link>
          </div>
        )}
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-surface" />}>
            <ShopSidebarFilters
              categories={categories}
              sellers={sellers}
              categorySlug={categorySlug}
              subcategorySlug={subcategorySlug}
              totalListingsCount={totalListingsCount}
            />
          </Suspense>

          <div>
            <p className="mb-5 text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredProducts.length}</span> of {productsData.pagination?.total || filteredProducts.length}
            </p>
            {filteredProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
                <p className="font-display text-2xl font-semibold">Nothing matches</p>
                <p className="mt-2 text-sm text-muted-foreground">Try a different search or widen your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((p: GenericProduct) => (
                  <ApiProductCard key={p.id} product={p as any} />
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
