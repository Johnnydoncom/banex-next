import Link from "next/link"
import { Suspense } from "react"
import { ApiProductCard } from "@/components/ApiProductCard"
import { Pagination, buildQuery } from "@/components/Pagination"
import { ShopHeaderFilters, ShopSidebarFilters } from "./components/ShopFilters"
import { fetchGenericCategories, fetchGenericCategory, fetchGenericProducts, GenericCategory, GenericProduct } from "@/lib/generic-api"
import { categoryPathBySlug, shopHrefFor } from "@/lib/categories"
import type { Metadata } from "next"
import { buildMetadata, metadataFromApiSeo } from "@/lib/seo/metadata"
import { JsonLd } from "@/lib/seo/JsonLdComponent"
import { itemListSchema, breadcrumbSchema } from "@/lib/seo/jsonld"

export const dynamic = 'force-dynamic'

/**
 * The category actually being viewed is the DEEPEST slug in the URL.
 * Links are `/shop/{department}/{node}` where `node` can sit at any depth
 * (e.g. `/shop/fashion/pants-jeans` → Fashion › Men Fashion › Pants & Jeans).
 */
function viewedSlugFrom(slugArray: string[] | undefined): string | undefined {
  const segs = (slugArray ?? []).filter((s) => s && s !== "all")
  return segs[segs.length - 1]
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {
  const resolvedParams = await params
  const viewedSlug = viewedSlugFrom(resolvedParams.slug)
  if (!viewedSlug) {
    return buildMetadata({
      title: "Marketplace — Shop All Categories",
      description:
        "Browse thousands of verified listings across Nigeria on Banex Mall — phones, fashion, electronics, groceries, vehicles, property and more. Same-hour delivery.",
      path: "/shop",
    })
  }
  try {
    // The by-slug endpoint resolves categories at ANY depth and returns their own seo.
    const { category, seo } = await fetchGenericCategory(viewedSlug)
    if (category) {
      return metadataFromApiSeo(seo, {
        title: `${category.name} in Nigeria`,
        description: `Shop ${category.name} from verified vendors on Banex Mall — compare prices, escrow protected, same-hour rider delivery across Nigeria.`,
        path: `/shop/${(resolvedParams.slug ?? []).join("/")}`,
        images: [`/og/category/${category.slug}`],
      })
    }
  } catch (e) { }
  return buildMetadata({ title: "Marketplace", path: "/shop" })
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
  const viewedSlug = viewedSlugFrom(slugArray)

  const q = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : undefined
  const sort = typeof resolvedSearchParams.sort === "string" ? resolvedSearchParams.sort : undefined
  const maxPriceParam = typeof resolvedSearchParams.max_price === "string" ? Number(resolvedSearchParams.max_price) : undefined
  const pageParam = typeof resolvedSearchParams.page === "string" ? Math.max(1, parseInt(resolvedSearchParams.page, 10) || 1) : 1
  const PER_PAGE = 12

  let categoriesData: any = {}
  let productsData: any = {}

  try {
    categoriesData = (await fetchGenericCategories()) || {}
    // Filter by the viewed (most specific) category; the API includes its descendants.
    productsData = await fetchGenericProducts({
      q,
      category: viewedSlug,
      sort,
      max_price: maxPriceParam,
      page: pageParam,
      per_page: PER_PAGE,
    }) || {}
  } catch (e) {
    console.error("[shop] Failed to fetch data:", e)
  }

  const categories: GenericCategory[] = categoriesData.categories || []
  const totalListingsCount = categoriesData.total_listings_count || 0

  // Full ancestor trail for the viewed category, e.g. [Fashion, Men Fashion, Pants & Jeans].
  const trail = categoryPathBySlug(categories, viewedSlug)
  const activeCategory = trail[trail.length - 1]
  const rootSlug = trail[0]?.slug
  const crumbs = trail.map((c) => ({ name: c.name, path: shopHrefFor(rootSlug!, c.slug) }))
  // Hero art: the viewed category's image, else the nearest ancestor that has one.
  const heroImage = [...trail].reverse().find((c) => c.image_url)?.image_url

  const filteredProducts: GenericProduct[] = productsData.products || []
  const pagination = productsData.pagination as { current_page: number; last_page: number; total: number; per_page: number } | undefined
  const basePath = slugArray?.length ? `/shop/${slugArray.join("/")}` : "/shop"

  const shopJsonLd = [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Marketplace", path: "/shop" },
      ...crumbs,
    ]),
    ...(filteredProducts.length
      ? [
        itemListSchema(
          activeCategory ? `${activeCategory.name} listings` : "Marketplace listings",
          filteredProducts.slice(0, 40).map((p: GenericProduct) => ({
            name: p.name,
            path: `/product/${p.slug}`,
            image: p.images?.find((i) => i.is_primary)?.url || p.images?.[0]?.url,
          })),
        ),
      ]
      : []),
  ]

  return (
    <div>
      <JsonLd schema={shopJsonLd} />
      <section className="relative overflow-hidden bg-white pt-10 pb-16 md:pt-16 md:pb-24 border-b border-border">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-soft/20 via-transparent to-transparent"></div>
        <div className="absolute -top-[20%] -left-[10%] z-0 h-[500px] w-[500px] rounded-full bg-brand/5 blur-[100px] pointer-events-none"></div>

        {heroImage && (
          <div className="absolute right-0 top-0 z-0 hidden h-full w-1/3 md:block">
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent z-10"></div>
            <img src={heroImage} alt="" className="h-full w-full object-cover object-center opacity-40 mix-blend-multiply" />
          </div>
        )}

        <div className="relative z-10 mx-auto container">
          <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Link href="/" className="hover:text-brand transition-colors">Home</Link>
            <span className="text-border">•</span>
            <Link href="/shop" className="hover:text-brand transition-colors">Marketplace</Link>
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1
              return (
                <span key={crumb.path} className="flex items-center gap-2">
                  <span className="text-border">•</span>
                  {isLast ? (
                    <span aria-current="page" className="text-brand font-bold">{crumb.name}</span>
                  ) : (
                    <Link href={crumb.path} className="hover:text-brand transition-colors">{crumb.name}</Link>
                  )}
                </span>
              )
            })}
          </nav>

          <div className="max-w-4xl">
            <h1 className="font-display text-5xl font-extrabold tracking-tight text-foreground md:text-6xl lg:text-7xl">
              {activeCategory ? activeCategory.name : "Marketplace"}
            </h1>
            <p className="mt-5 text-lg font-medium text-muted-foreground md:text-xl max-w-2xl">
              Discover <span className="font-bold text-foreground">{productsData.pagination?.total || filteredProducts.length}</span> verified listings
              {trail.length > 1 ? <> in <span className="font-semibold text-foreground">{trail[trail.length - 2].name}</span></> : null} across Nigeria. The best deals, curated for you.
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
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-surface" />}>
            <ShopSidebarFilters
              categories={categories}
              activeSlug={activeCategory?.slug}
              trailSlugs={trail.map((c) => c.slug)}
              totalListingsCount={totalListingsCount}
            />
          </Suspense>

          <div>
            <p className="mb-5 text-sm text-muted-foreground">
              {pagination && pagination.total > 0 ? (
                <>
                  Showing{" "}
                  <span className="font-semibold text-foreground">
                    {(pagination.current_page - 1) * pagination.per_page + 1}–
                    {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
                  </span>{" "}
                  of <span className="font-semibold text-foreground">{pagination.total}</span>
                </>
              ) : (
                <>Showing <span className="font-semibold text-foreground">{filteredProducts.length}</span></>
              )}
            </p>
            {filteredProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
                <p className="font-display text-2xl font-semibold">Nothing matches</p>
                <p className="mt-2 text-sm text-muted-foreground">Try a different search or widen your filters.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3 ">
                  {filteredProducts.map((p: GenericProduct) => (
                    <ApiProductCard key={p.id} product={p as any} />
                  ))}
                </div>
                {pagination && (
                  <Pagination
                    currentPage={pagination.current_page}
                    lastPage={pagination.last_page}
                    total={pagination.total}
                    perPage={pagination.per_page}
                    hrefForPage={(n) => `${basePath}${buildQuery({ q, sort, max_price: maxPriceParam, page: n > 1 ? n : undefined })}`}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </section>

    </div>
  )
}
