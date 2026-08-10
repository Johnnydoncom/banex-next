import Link from "next/link"
import { PageShell } from "@/components/PageShell"
import { buildMetadata } from "@/lib/seo/metadata"

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "How Banex Mall collects, uses, protects and shares your personal information when you shop, sell or browse our marketplace.",
  path: "/privacy",
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

export default function PrivacyPage() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Privacy policy"
      description="Your privacy matters. This policy explains what we collect and how we use it."
    >
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft md:p-8">
        <p className="text-xs text-muted-foreground">Last updated: {UPDATED}</p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          This Privacy Policy describes how Banex Mall (&ldquo;Banex&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) collects,
          uses, and protects your personal information when you use our website, marketplace, and related services (the
          &ldquo;Services&rdquo;). By using the Services you agree to the practices described here.
        </p>

        <div className="mt-8 space-y-6">
          <Section title="1. Information we collect">
            <ul className="list-disc space-y-1.5 pl-5">
              <li><strong className="text-foreground">Account information</strong> — name, email, phone number and password when you register.</li>
              <li><strong className="text-foreground">Order &amp; delivery details</strong> — items purchased, delivery addresses, and fulfilment preferences.</li>
              <li><strong className="text-foreground">Payment information</strong> — processed securely by our payment partners; we do not store full card numbers.</li>
              <li><strong className="text-foreground">Seller information</strong> — shop details, KYC/verification data and payout bank accounts, for users who sell.</li>
              <li><strong className="text-foreground">Usage data</strong> — device, browser, pages viewed and interactions, collected to improve the Services.</li>
            </ul>
          </Section>

          <Section title="2. How we use your information">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>To create and manage your account and process orders through our escrow system.</li>
              <li>To arrange delivery or in-mall pickup and keep you updated on your order.</li>
              <li>To verify sellers, prevent fraud, and keep the marketplace safe.</li>
              <li>To provide customer support and respond to your requests.</li>
              <li>To send service and, where permitted, marketing communications you can opt out of.</li>
            </ul>
          </Section>

          <Section title="3. Escrow &amp; payments">
            <p>
              Payments are held in escrow and only released to a seller after you confirm receipt of your order. Payment
              processing is handled by licensed third-party providers; your payment details are shared with them solely to
              complete your transaction.
            </p>
          </Section>

          <Section title="4. Sharing your information">
            <p>We share personal information only as needed to run the Services, including with:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Sellers, to fulfil orders you place with them.</li>
              <li>Delivery and logistics partners, to deliver your order.</li>
              <li>Payment processors, to complete transactions and payouts.</li>
              <li>Authorities, where required by law or to protect our rights and users.</li>
            </ul>
            <p>We do not sell your personal information.</p>
          </Section>

          <Section title="5. Data retention &amp; security">
            <p>
              We keep your information for as long as your account is active or as needed to provide the Services and meet
              legal obligations. We use technical and organisational measures to protect your data, though no method of
              transmission over the internet is completely secure.
            </p>
          </Section>

          <Section title="6. Your rights">
            <p>
              Subject to applicable law, you may access, correct, or delete your personal information, and object to or
              restrict certain processing. You can manage most details from your{" "}
              <Link href="/account/profile" className="text-brand hover:underline">account profile</Link>, or contact us
              for help.
            </p>
          </Section>

          <Section title="7. Cookies">
            <p>
              We use cookies and similar technologies to keep you signed in, remember your cart, and understand how the
              Services are used. You can control cookies through your browser settings.
            </p>
          </Section>

          <Section title="8. Children">
            <p>The Services are not directed to children under 18, and we do not knowingly collect their data.</p>
          </Section>

          <Section title="9. Changes to this policy">
            <p>
              We may update this policy from time to time. Material changes will be posted on this page with a revised
              &ldquo;last updated&rdquo; date.
            </p>
          </Section>

          <Section title="10. Contact us">
            <p>
              Questions about this policy? Reach us via the{" "}
              <Link href="/contact" className="text-brand hover:underline">contact page</Link>. See also our{" "}
              <Link href="/terms" className="text-brand hover:underline">Terms of Service</Link>.
            </p>
          </Section>
        </div>
      </div>
    </PageShell>
  )
}
