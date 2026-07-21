import { PageShell } from "@/components/PageShell"
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react"
import { buildMetadata } from "@/lib/seo/metadata"
import { JsonLd } from "@/lib/seo/JsonLdComponent"
import { webPageSchema, breadcrumbSchema } from "@/lib/seo/jsonld"
import { ContactForm } from "./ContactForm"

export const metadata = buildMetadata({
  title: "Contact Banex Mall — Support & Partnerships",
  titleAbsolute: true,
  description:
    "Reach the Banex Mall team about orders, listings or partnerships. Call, WhatsApp or email us — we respond within 24 hours.",
  path: "/contact",
})

export default function ContactPage() {
  return (
    <PageShell
      eyebrow="We're here to help"
      title="Contact Banex Mall"
      description="Reach out about orders, listings, or partnerships. Our team responds within 24 hours."
    >
      <JsonLd
        schema={[
          webPageSchema({ name: "Contact Banex Mall", path: "/contact", type: "ContactPage" }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
        ]}
      />
      <div className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
        <div className="space-y-5">
          {[
            { icon: Phone, t: "Call us", s: "+234 800 BANEX 00", sub: "Mon–Sat, 8am – 7pm" },
            { icon: MessageCircle, t: "WhatsApp", s: "+234 901 234 5678", sub: "Fastest response" },
            { icon: Mail, t: "Email", s: "support@banexmall.ng", sub: "24-hour reply" },
            { icon: MapPin, t: "Head office", s: "Banex Plaza, Wuse 2", sub: "Abuja, Nigeria" },
          ].map(({ icon: Icon, t, s, sub }) => (
            <div key={t} className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft/30">
                <Icon className="h-5 w-5 text-brand-deep" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{t}</p>
                <p className="mt-0.5 font-semibold">{s}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        <ContactForm />
      </div>
    </PageShell>
  )
}
