import Link from "next/link"
import { PageShell } from "@/components/PageShell"
import { products } from "@/lib/products"
import { BadgeCheck, MapPin, Star } from "lucide-react"
import { buildMetadata } from "@/lib/seo/metadata"

export const metadata = buildMetadata({
  title: "Top Sellers on Banex Mall",
  titleAbsolute: true,
  description:
    "Meet the highest-rated, most-trusted verified sellers on Banex Mall — ranked by ratings and reviews across Nigeria.",
  path: "/top-sellers",
})

export default function TopSellersPage() {
  // Aggregate unique sellers across all products
  const map = new Map<string, { id: string; name: string; rating: number; reviews: number; verified: boolean; location: string; listings: number }>()
  for (const p of products) {
    for (const s of p.sellers) {
      const existing = map.get(s.id)
      if (existing) existing.listings += 1
      else map.set(s.id, { id: s.id, name: s.name, rating: s.rating, reviews: s.reviews, verified: s.verified, location: s.location, listings: 1 })
    }
  }
  const sellers = [...map.values()].sort((a, b) => b.rating * b.reviews - a.rating * a.reviews)

  return (
    <PageShell
      eyebrow="Trusted partners"
      title="Top sellers on Banex Mall"
      description="Verified businesses with the highest ratings, most reviews, and fastest delivery across Nigeria."
    >
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {sellers.map((s, i) => (
          <div key={s.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-brand text-lg font-bold text-primary-foreground">
                  {s.name.charAt(0)}
                </div>
                <div>
                  <p className="font-display text-base font-bold">{s.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {s.location}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-brand-soft/30 px-2 py-1 text-[10px] font-bold text-brand-deep">#{i + 1}</span>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-brand text-brand" /> {s.rating} ({s.reviews})
              </span>
              <span>{s.listings} listing{s.listings > 1 ? "s" : ""}</span>
            </div>
            {s.verified && (
              <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand-deep">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified seller
              </p>
            )}
            <Link href="/shop" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
              View listings →
            </Link>
          </div>
        ))}
      </div>
    </PageShell>
  )
}
