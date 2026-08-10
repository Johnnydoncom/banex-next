import Link from "next/link"
import { PageShell } from "@/components/PageShell"
import { buildMetadata } from "@/lib/seo/metadata"

export const metadata = buildMetadata({
  title: "Terms of Service",
  description:
    "The terms and conditions governing your use of the Banex Mall marketplace — buying, selling, escrow, delivery, returns and more.",
  path: "/terms",
})

const UPDATED = "10 August 2026"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-6">
      <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  )
}

export default function TermsPage() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Terms of service"
      description="The rules for using Banex Mall. Please read them carefully."
    >
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft md:p-8">
        <p className="text-xs text-muted-foreground">Last updated: {UPDATED}</p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the Banex Mall marketplace,
          website, and related services (the &ldquo;Services&rdquo;). By creating an account or using the Services, you
          agree to these Terms. If you do not agree, please do not use the Services.
        </p>

        <div className="mt-8 space-y-6">
          <Section title="1. Your account">
            <p>
              You must provide accurate information and are responsible for keeping your login credentials secure and for
              all activity under your account. You must be at least 18 years old to use the Services.
            </p>
          </Section>

          <Section title="2. Buying on Banex">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>When you place an order, your payment is held in <strong className="text-foreground">escrow</strong> and released to the seller only after you confirm you&apos;ve received your item.</li>
              <li>Product details, pricing and availability (including per-variant colour/size options) are provided by sellers and may change.</li>
              <li>You agree to pay the total shown at checkout, including any delivery fees and applicable taxes.</li>
            </ul>
          </Section>

          <Section title="3. Selling on Banex">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Sellers must complete verification and provide accurate shop, product and payout details.</li>
              <li>You are responsible for the products you list, their descriptions, pricing, stock and fulfilment.</li>
              <li>Prohibited, counterfeit or illegal items are not allowed and may result in removal or suspension.</li>
              <li>Platform commission and payout terms apply to completed sales as disclosed in your seller dashboard.</li>
            </ul>
          </Section>

          <Section title="4. Escrow, delivery &amp; confirmation">
            <p>
              Orders are fulfilled by delivery or in-mall pickup. You confirm receipt once your item is in hand, which
              completes the order and releases payment to the seller. Please only confirm after you have actually received
              your order.
            </p>
          </Section>

          <Section title="5. Returns &amp; refunds">
            <p>
              Eligible orders are covered by our buyer protection. See the{" "}
              <Link href="/returns" className="text-brand hover:underline">Returns &amp; Refunds</Link> page for how
              returns, pickups and escrow refunds work.
            </p>
          </Section>

          <Section title="6. Acceptable use">
            <p>You agree not to misuse the Services, including by:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Engaging in fraud, or listing counterfeit, unsafe or prohibited items.</li>
              <li>Attempting to bypass escrow or transact off-platform to evade buyer protection.</li>
              <li>Interfering with the Services or accessing them by unauthorised means.</li>
            </ul>
          </Section>

          <Section title="7. Intellectual property">
            <p>
              The Services, including our branding and content, are owned by Banex or our licensors. Seller content
              remains the responsibility of the respective seller. You may not copy or use our content without permission.
            </p>
          </Section>

          <Section title="8. Disclaimers &amp; liability">
            <p>
              The Services are provided &ldquo;as is&rdquo; without warranties of any kind. To the extent permitted by
              law, Banex is not liable for indirect or consequential damages arising from your use of the Services.
            </p>
          </Section>

          <Section title="9. Suspension &amp; termination">
            <p>
              We may suspend or terminate accounts that violate these Terms or applicable law, or to protect users and the
              integrity of the marketplace.
            </p>
          </Section>

          <Section title="10. Changes to these Terms">
            <p>
              We may update these Terms from time to time. Continued use of the Services after changes take effect
              constitutes acceptance of the revised Terms.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              Questions about these Terms? Visit our{" "}
              <Link href="/contact" className="text-brand hover:underline">contact page</Link>. See also our{" "}
              <Link href="/privacy" className="text-brand hover:underline">Privacy Policy</Link>.
            </p>
          </Section>
        </div>
      </div>
    </PageShell>
  )
}
