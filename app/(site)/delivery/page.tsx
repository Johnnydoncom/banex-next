import { PageShell } from "@/components/PageShell"
import { Bike, MapPin, PackageCheck, Truck } from "lucide-react"
import { buildMetadata } from "@/lib/seo/metadata"

export const metadata = buildMetadata({
  title: "Delivery Across Nigeria — Zones, Times & Fees",
  description:
    "Same-hour rider delivery in Lagos, Abuja and Port Harcourt, plus reliable 1–5 day nationwide courier to all 36 states. See delivery zones, times and fees.",
  path: "/delivery",
})

const zones = [
  { city: "Lagos", time: "Same-day – 1 day", fee: "₦1,500 – ₦3,500" },
  { city: "Abuja", time: "1 – 2 days", fee: "₦2,000 – ₦4,000" },
  { city: "Port Harcourt", time: "2 – 3 days", fee: "₦2,500 – ₦4,500" },
  { city: "Other state capitals", time: "3 – 5 days", fee: "₦3,000 – ₦6,000" },
  { city: "Remote areas", time: "5 – 7 days", fee: "From ₦5,000" },
]

export default function DeliveryPage() {
  return (
    <PageShell
      eyebrow="Logistics"
      title="Delivery across Nigeria"
      description="We partner with trusted couriers to deliver your orders quickly and safely — wherever you are."
    >
      <div className="grid gap-5 md:grid-cols-3">
        {[
          { icon: Bike, t: "Express within city", s: "Same-day in Lagos, Abuja & PH for orders before 12pm." },
          { icon: Truck, t: "Nationwide courier", s: "Reliable 1–5 day delivery to all 36 states." },
          { icon: PackageCheck, t: "Door-to-door", s: "Delivered straight to your address with verification on collection." },
        ].map(({ icon: Icon, t, s }) => (
          <div key={t} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft/30">
              <Icon className="h-5 w-5 text-brand-deep" />
            </div>
            <h3 className="mt-4 font-semibold">{t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s}</p>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="font-display text-2xl font-bold">Delivery zones & timelines</h2>
        <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-surface/60 text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Zone</th>
                <th className="px-5 py-3">Estimated time</th>
                <th className="px-5 py-3">Fee range</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.city} className="border-t border-border">
                  <td className="px-5 py-3 font-medium"><MapPin className="mr-1.5 inline h-3.5 w-3.5 text-brand" />{z.city}</td>
                  <td className="px-5 py-3 text-muted-foreground">{z.time}</td>
                  <td className="px-5 py-3 text-muted-foreground">{z.fee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Free delivery on eligible orders over ₦500,000. Final fees and timelines are confirmed at checkout based on seller location.</p>
      </div>
    </PageShell>
  )
}
