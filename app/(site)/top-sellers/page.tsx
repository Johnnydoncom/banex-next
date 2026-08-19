import Link from "next/link"
import Image from "next/image"
import { PageShell } from "@/components/PageShell"
import { fetchGenericSellers, type GenericSeller } from "@/lib/generic-api"
import { BadgeCheck, MapPin, Star, Store } from "lucide-react"
import { buildMetadata } from "@/lib/seo/metadata"

export const metadata = buildMetadata({
  title: "Top Sellers on Banex Mall",
  titleAbsolute: true,
  description:
    "Meet the highest-rated, most-trusted verified sellers on Banex Mall — ranked by ratings and reviews across Nigeria.",
  path: "/top-sellers",
})

// Refresh the ranking periodically (ISR) so new/updated sellers appear without a rebuild.
export const revalidate = 300

// The /generic/sellers endpoint only allows sort by shop_name/created_at/approved_at/products_count,
// so we fetch and rank by rating (rating × review volume), falling back to catalogue size.
function score(s: GenericSeller) {
  return (s.rating_average ?? 0) * (s.reviews_count ?? 0)
}

export default async function TopSellersPage() {
  let sellers: GenericSeller[] = []
  try {
    const data = await fetchGenericSellers()
    sellers = data?.sellers ?? []
  } catch (e) {
    console.error("[top-sellers] Failed to fetch sellers:", e)
  }

  const ranked = [...sellers].sort((a, b) => {
    const diff = score(b) - score(a)
    if (diff !== 0) return diff
    const listings = (b.listings_count ?? 0) - (a.listings_count ?? 0)
    if (listings !== 0) return listings
    return (a.shop_name ?? "").localeCompare(b.shop_name ?? "")
  })

  return (
    <PageShell
      eyebrow="Trusted partners"
      title="Top sellers on Banex Mall"
      description="Verified businesses with the highest ratings, most reviews, and fastest delivery across Nigeria."
    >
      {ranked.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Store className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 font-semibold">No sellers to show yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Check back soon as more vendors join the mall.</p>
          <Link href="/vendors" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
            Browse all vendors →
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {ranked.map((s, i) => {
            const rating = s.rating_average ?? null
            const reviews = s.reviews_count ?? 0
            const listings = s.listings_count ?? 0
            return (
              <div key={s.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-full bg-gradient-brand text-lg font-bold text-primary-foreground">
                      {s.cover_image_url ? (
                        <Image src={s.cover_image_url} alt={s.shop_name} fill className="object-cover" sizes="48px" />
                      ) : (
                        s.shop_name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-display text-base font-bold">{s.shop_name}</p>
                      {s.location && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {s.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="rounded-full bg-brand-soft/30 px-2 py-1 text-[10px] font-bold text-brand-deep">#{i + 1}</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-brand text-brand" />
                    {rating != null ? `${rating} (${reviews})` : "No reviews yet"}
                  </span>
                  <span>{listings} listing{listings === 1 ? "" : "s"}</span>
                </div>
                {s.is_kyc_verified && (
                  <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand-deep">
                    <BadgeCheck className="h-3.5 w-3.5" /> Verified seller
                  </p>
                )}
                <Link
                  href={`/vendor/${s.slug}`}
                  className="mt-4 inline-block text-sm font-medium text-brand hover:underline"
                >
                  View store →
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
