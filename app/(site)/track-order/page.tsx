import { Suspense } from "react"
import { PageShell } from "@/components/PageShell"
import { buildMetadata } from "@/lib/seo/metadata"
import { TrackOrderForm } from "./TrackOrderForm"

export const metadata = buildMetadata({
  title: "Track Your Order",
  description:
    "Enter your Banex Mall order ID or tracking number to see real-time delivery status — order placed, packed, out for delivery and delivered.",
  path: "/track-order",
  noindex: true,
})

export default function TrackOrderPage() {
  return (
    <PageShell
      eyebrow="Order tracking"
      title="Track your order"
      description="Enter your order reference to see real-time status. Checked out as a guest? Add the email you used."
    >
      {/* The form reads ?reference= from the URL, which needs a Suspense boundary. */}
      <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl border border-border bg-card" />}>
        <TrackOrderForm />
      </Suspense>
    </PageShell>
  )
}
