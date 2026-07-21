import { fetchGenericSeller } from "@/lib/generic-api"
import { brandOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og"

export const alt = "Vendor on Banex Mall"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function VendorOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  try {
    const { seller } = await fetchGenericSeller(slug)

    const badges: string[] = []
    if (seller.rating_average) badges.push(`★ ${seller.rating_average}`)
    if (seller.is_kyc_verified) badges.push("Verified")
    if (typeof seller.listings_count === "number") badges.push(`${seller.listings_count} listings`)

    return brandOgImage({
      eyebrow: seller.tier === "premium" ? "Premium vendor" : "Mall vendor",
      title: seller.shop_name,
      subtitle: seller.location ? `📍 ${seller.location}` : "Inside Banex Mall",
      imageUrl: seller.cover_image_url || null,
      badges,
    })
  } catch {
    return brandOgImage({ eyebrow: "Vendors", title: "Banex Mall Vendors", subtitle: "Every shop in the mall" })
  }
}
