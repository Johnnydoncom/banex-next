import Link from "next/link"
import { PageShell } from "@/components/PageShell"
import { ArrowRight, BadgeCheck, Camera, DollarSign, Megaphone, ShieldCheck, Upload } from "lucide-react"
import { buildMetadata } from "@/lib/seo/metadata"
import { JsonLd } from "@/lib/seo/JsonLdComponent"
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/jsonld"

export const metadata = buildMetadata({
  title: "Sell on Banex Mall — List Anything in Nigeria",
  titleAbsolute: true,
  description:
    "Reach thousands of verified buyers across Nigeria. Zero setup fees, secure escrow payouts, built-in marketing and tools to grow your business on Banex Mall.",
  path: "/sell",
})

export default function SellPage() {
  return (
    <PageShell
      eyebrow="For sellers"
      title="Sell anything on Banex Mall"
      description="Reach thousands of verified buyers across Nigeria. Zero setup fees, secure escrow payouts, and tools to grow your business."
    >
      <JsonLd schema={[webPageSchema({ name: "Sell on Banex Mall", path: "/sell", description: "How to sell on Banex Mall." }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Sell", path: "/sell" }])]} />
      <div className="grid gap-5 md:grid-cols-3">
        {[
          { icon: Upload, t: "1. Create your listing", s: "Add clear photos, set your price, and describe your item." },
          { icon: BadgeCheck, t: "2. Get verified", s: "Quick KYC review — usually approved within 48 hours." },
          { icon: DollarSign, t: "3. Get paid securely", s: "Buyers pay into escrow. We release funds once they confirm." },
        ].map(({ icon: Icon, t, s }) => (
          <div key={t} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft/30">
              <Icon className="h-5 w-5 text-brand-deep" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold">{t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {[
          { icon: ShieldCheck, t: "Buyer & seller protection", s: "Escrow holds payment until both sides are happy." },
          { icon: Megaphone, t: "Built-in marketing", s: "Featured placement, search boosts, and category spotlights." },
          { icon: Camera, t: "Easy mobile uploads", s: "Snap, list and publish in under 2 minutes." },
          { icon: BadgeCheck, t: "Verified badge", s: "Stand out with a verified seller badge buyers trust." },
        ].map(({ icon: Icon, t, s }) => (
          <div key={t} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft/30">
              <Icon className="h-5 w-5 text-brand-deep" />
            </div>
            <div>
              <h4 className="font-semibold">{t}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{s}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-3xl bg-gradient-brand p-10 text-primary-foreground md:p-14">
        <h2 className="font-display text-3xl font-extrabold md:text-4xl">Ready to start selling?</h2>
        <p className="mt-3 max-w-md text-sm opacity-90">Create your seller account in minutes. We'll guide you through your first listing.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/become-seller" className="inline-flex items-center gap-2 rounded-full bg-card px-6 py-3 text-sm font-semibold text-brand-deep shadow-soft">
            Become a seller <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/top-sellers" className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold">
            See top sellers
          </Link>
        </div>
      </div>
    </PageShell>
  )
}
