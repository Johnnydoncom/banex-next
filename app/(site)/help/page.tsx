import Link from "next/link"
import { PageShell } from "@/components/PageShell"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { buildMetadata } from "@/lib/seo/metadata"
import { JsonLd } from "@/lib/seo/JsonLd"
import { faqSchema, breadcrumbSchema } from "@/lib/seo/jsonld"

export const metadata = buildMetadata({
  title: "Help Center & FAQ",
  description:
    "Answers about escrow, becoming a verified seller, payments, offers, returns and buyer protection on Banex Mall.",
  path: "/help",
})

const faqs = [
  { q: "How does escrow work on Banex Mall?", a: "When you pay, your money is held safely by Banex. We only release it to the seller once you confirm you've received the item as described." },
  { q: "How do I become a verified seller?", a: "Apply via Become a Seller. We review your KYC and business details, usually within 48 hours." },
  { q: "What payment methods are supported?", a: "Card payments, bank transfer, and USSD are all available at checkout." },
  { q: "Can I make an offer or bid on a listing?", a: "Yes. On the product page tap Make Offer to negotiate or Request Quote for bulk enquiries." },
  { q: "What if my item arrives damaged?", a: "You're covered by our 7-day buyer protection. Open a return from Track Order and we'll arrange pickup and refund." },
  { q: "How are sellers vetted?", a: "Verified sellers complete KYC, ID verification, and meet rating thresholds. Look for the green Verified badge." },
]

export default function HelpPage() {
  return (
    <PageShell
      eyebrow="Support"
      title="Help center"
      description="Find quick answers, or reach out to our team — we're here to help."
    >
      <JsonLd schema={[faqSchema(faqs), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Help", path: "/help" }])]} />
      <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-2 shadow-soft">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`f-${i}`} className="border-b border-border last:border-0">
            <AccordionTrigger className="px-4 text-left text-base font-semibold hover:no-underline">{f.q}</AccordionTrigger>
            <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <Link href="/track-order" className="rounded-2xl border border-border bg-card p-5 hover:border-brand">
          <p className="font-semibold">Track an order</p>
          <p className="mt-1 text-sm text-muted-foreground">See real-time status of your delivery.</p>
        </Link>
        <Link href="/returns" className="rounded-2xl border border-border bg-card p-5 hover:border-brand">
          <p className="font-semibold">Returns & refunds</p>
          <p className="mt-1 text-sm text-muted-foreground">7-day buyer protection details.</p>
        </Link>
        <Link href="/contact" className="rounded-2xl border border-border bg-card p-5 hover:border-brand">
          <p className="font-semibold">Contact support</p>
          <p className="mt-1 text-sm text-muted-foreground">Get a human on chat, email or phone.</p>
        </Link>
      </div>
    </PageShell>
  )
}
