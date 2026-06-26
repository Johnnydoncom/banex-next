import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { GenericSeller } from "@/lib/generic-api"
import { MallVendorCard } from "@/components/MallVendorCard"

export function VendorRail({
  vendors,
  limit = 8,
  title = "Mall vendors",
  eyebrow = "Tenant prominence",
}: {
  vendors: GenericSeller[]
  limit?: number
  title?: string
  eyebrow?: string
}) {
  const list = vendors.slice(0, limit)
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-deep">{eyebrow}</p>
          <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">{title}</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Anchor and premium tenants of Banex Mall — order in for same-hour rider delivery, or visit them in-store.
          </p>
        </div>
        <Link href="/vendors" className="hidden text-sm font-medium text-brand hover:underline md:inline-flex">
          All vendors <ArrowRight className="ml-1 inline h-4 w-4" />
        </Link>
      </div>
      <div className="mt-7 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
        {list.map((v) => (
          <MallVendorCard key={v.id} vendor={v} />
        ))}
      </div>
    </section>
  )
}
