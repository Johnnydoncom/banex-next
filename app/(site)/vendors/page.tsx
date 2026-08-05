import Link from "next/link"
import { Store, Bike, MapPin } from "lucide-react"
import { PageShell } from "@/components/PageShell"
import { MallVendorCard } from "@/components/MallVendorCard"
import { fetchGenericSellers, GenericSeller, fetchGenericCategories } from "@/lib/generic-api"
import { Pagination, buildQuery } from "@/components/Pagination"
import { VendorFilters } from "./components/VendorFilters"
import { buildMetadata } from "@/lib/seo/metadata"
import { JsonLd } from "@/lib/seo/JsonLdComponent"
import { itemListSchema, breadcrumbSchema } from "@/lib/seo/jsonld"

export const metadata = buildMetadata({
  title: "Banex Mall Vendors — Every Shop in the Mall",
  titleAbsolute: true,
  description:
    "Browse every shop inside Banex Mall — anchor brands to neighbourhood favourites. Order in for same-hour rider delivery or visit them in-store.",
  path: "/vendors",
})

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const q = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q.toLowerCase() : ""
  const cat = typeof resolvedSearchParams.cat === "string" ? resolvedSearchParams.cat : "all"
  const pageParam = typeof resolvedSearchParams.page === "string" ? Math.max(1, parseInt(resolvedSearchParams.page, 10) || 1) : 1
  const PER_PAGE = 12

  let sellers: GenericSeller[] = []
  let categoriesData: any = {}

  try {
    // Filtering (q/cat) is done here, so pull the full set of sellers to filter
    // against, then paginate the filtered result below.
    const [sellersData, catData] = await Promise.all([
      fetchGenericSellers({ per_page: 100 }),
      fetchGenericCategories()
    ])
    sellers = sellersData?.sellers || []
    categoriesData = catData || {}
  } catch (e) {
    console.error("[vendors] Failed to fetch data:", e)
  }

  const categories = categoriesData.categories || []

  // Perform basic filtering on the server if the API doesn't support query filtering yet.
  // We filter by name/description (q) and category (cat)
  const filteredSellers = sellers.filter((v) => {
    if (cat !== "all" && v.category?.slug !== cat) return false
    if (q) {
      const matchName = v.shop_name?.toLowerCase().includes(q)
      const matchDesc = v.description?.toLowerCase().includes(q)
      if (!matchName && !matchDesc) return false
    }
    return true
  })

  // Paginate the filtered list.
  const lastPage = Math.max(1, Math.ceil(filteredSellers.length / PER_PAGE))
  const currentPage = Math.min(pageParam, lastPage)
  const pagedSellers = filteredSellers.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  const vendorsJsonLd = [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Vendors", path: "/vendors" },
    ]),
    ...(filteredSellers.length
      ? [
          itemListSchema(
            "Banex Mall vendors",
            filteredSellers.map((v) => ({
              name: v.shop_name,
              path: `/vendor/${v.slug}`,
              image: v.cover_image_url,
            })),
          ),
        ]
      : []),
  ]

  return (
    <PageShell
      eyebrow="Tenants"
      title="Banex Mall vendors"
      description="Every shop inside our physical mall — from anchor brands to neighbourhood favourites. Order in for rider delivery or visit them in-store."
    >
      <JsonLd schema={vendorsJsonLd} />
      <VendorFilters categories={categories} />

      <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><Store className="h-3.5 w-3.5 text-brand" /> {filteredSellers.length} vendors</span>
        <span className="inline-flex items-center gap-1.5"><Bike className="h-3.5 w-3.5 text-brand" /> Same-hour rider delivery</span>
        <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-brand" /> <Link href="/mall-map" className="hover:text-brand">View mall map</Link></span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {pagedSellers.map((v) => (
          <MallVendorCard key={v.id} vendor={v} />
        ))}
      </div>
      {filteredSellers.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          No vendors match these filters.
        </div>
      )}
      <Pagination
        currentPage={currentPage}
        lastPage={lastPage}
        total={filteredSellers.length}
        perPage={PER_PAGE}
        hrefForPage={(n) => `/vendors${buildQuery({ q: q || undefined, cat: cat !== "all" ? cat : undefined, page: n > 1 ? n : undefined })}`}
      />
    </PageShell>
  )
}
