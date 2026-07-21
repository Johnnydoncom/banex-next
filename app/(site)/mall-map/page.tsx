import Link from "next/link"
import { Navigation, Bike, Store } from "lucide-react"
import { PageShell } from "@/components/PageShell"
import { buildMetadata } from "@/lib/seo/metadata"

export const metadata = buildMetadata({
  title: "Mall Map & Shop Locator",
  description:
    "Banex Mall is a real, physical mall in Abuja. Find shops, opening hours and directions — or order same-hour rider delivery from any tenant.",
  path: "/mall-map",
})

export default function MallMapPage() {
  return (
    <PageShell
      eyebrow="Visit the mall"
      title="Mall map & shop locator"
      description="Banex Mall is a real, physical mall in Abuja. Tap any pin to see the shop, opening hours and how to get there. You can also order rider delivery from any tenant — same-hour across the city."
    >
      <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
        <h3 className="font-display text-xl font-bold text-foreground">Interactive map coming soon</h3>
        <p className="mt-2">We are currently mapping all the shops in Banex Mall.</p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/vendors"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-brand px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-soft"
          >
            <Store className="h-4 w-4" /> View all vendors
          </Link>
        </div>
      </div>
    </PageShell>
  )
}
