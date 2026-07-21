import Link from "next/link"
import { Store, Bike, MapPin } from "lucide-react"
import { PageShell } from "@/components/PageShell"
import { MallVendorCard } from "@/components/MallVendorCard"
import { fetchGenericSellers, GenericSeller, fetchGenericCategories } from "@/lib/generic-api"
import { VendorFilters } from "./components/VendorFilters"
import { buildMetadata } from "@/lib/seo/metadata"
import { JsonLd } from "@/lib/seo/JsonLd"
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

  let sellers: GenericSeller[] = []
  let categoriesData: any = {}
  
  try {
    const [sellersData, catData] = await Promise.all([
      fetchGenericSellers(),
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
        {filteredSellers.map((v, i) => (
          <MallVendorCard key={v.id} vendor={v} />
        ))}
      </div>
      {filteredSellers.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          No vendors match these filters.
        </div>
      )}
    </PageShell>
  )
}
