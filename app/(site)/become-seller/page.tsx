import { PageShell } from "@/components/PageShell"
import { buildMetadata } from "@/lib/seo/metadata"
import { JsonLd } from "@/lib/seo/JsonLd"
import { webPageSchema, breadcrumbSchema } from "@/lib/seo/jsonld"
import { BecomeSellerForm } from "./BecomeSellerForm"

export const metadata = buildMetadata({
  title: "Become a Verified Seller on Banex Mall",
  titleAbsolute: true,
  description:
    "Apply to sell on Banex Mall. Tell us about your business and get verified — usually approved within 48 hours. Zero setup fees, secure escrow payouts.",
  path: "/become-seller",
})

export default function BecomeSellerPage() {
  return (
    <PageShell
      eyebrow="Apply"
      title="Become a verified seller"
      description="Tell us a bit about your business. Approved within 48 hours."
    >
      <JsonLd
        schema={[
          webPageSchema({ name: "Become a Verified Seller", path: "/become-seller" }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Become a Seller", path: "/become-seller" },
          ]),
        ]}
      />
      <BecomeSellerForm />
    </PageShell>
  )
}
