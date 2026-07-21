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
      description="Enter your order ID or tracking number to see real-time status."
    >
      <TrackOrderForm />
    </PageShell>
  )
}
