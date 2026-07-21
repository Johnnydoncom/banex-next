import Link from "next/link"
import { PageShell } from "@/components/PageShell"
import { Clock, PackageCheck, RefreshCw, Wallet } from "lucide-react"
import { buildMetadata } from "@/lib/seo/metadata"

export const metadata = buildMetadata({
  title: "Returns & Refunds — 7-Day Buyer Protection",
  description:
    "Banex Mall's 7-day buyer protection means you only pay when you're happy. Learn how returns, free pickup and escrow refunds work.",
  path: "/returns",
})

export default function ReturnsPage() {
  return (
    <PageShell
      eyebrow="Buyer protection"
      title="Returns & refunds"
      description="Our 7-day buyer protection means you only pay when you're happy with your order."
    >
      <div className="grid gap-5 md:grid-cols-2">
        {[
          { icon: Clock, t: "7-day window", s: "You have 7 days from delivery to request a return." },
          { icon: PackageCheck, t: "Item must match listing", s: "Returns accepted if the item is significantly not as described, damaged or faulty." },
          { icon: RefreshCw, t: "Free return pickup", s: "We arrange pickup in major cities at no cost when the seller is at fault." },
          { icon: Wallet, t: "Escrow refunds", s: "Refunds are released from escrow within 48 hours of return verification." },
        ].map(({ icon: Icon, t, s }) => (
          <div key={t} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft/30">
              <Icon className="h-5 w-5 text-brand-deep" />
            </div>
            <h3 className="mt-4 font-semibold">{t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 space-y-6">
        <h2 className="font-display text-2xl font-bold">How to request a return</h2>
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li><span className="font-semibold text-foreground">1.</span> Open your order from <Link href="/track-order" className="text-brand hover:underline">Track Order</Link>.</li>
          <li><span className="font-semibold text-foreground">2.</span> Tap "Request return" and select a reason.</li>
          <li><span className="font-semibold text-foreground">3.</span> Our team reviews within 24 hours and arranges pickup.</li>
          <li><span className="font-semibold text-foreground">4.</span> Once received and verified, your refund is released from escrow.</li>
        </ol>
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-surface/60 p-5 text-sm text-muted-foreground">
        Need help with a return? <Link href="/contact" className="font-medium text-brand hover:underline">Contact support</Link>.
      </div>
    </PageShell>
  )
}
