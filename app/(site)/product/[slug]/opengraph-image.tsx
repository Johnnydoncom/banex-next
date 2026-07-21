import { fetchGenericProduct } from "@/lib/generic-api"
import { brandOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og"

export const alt = "Product on Banex Mall"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function ProductOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  try {
    const data = await fetchGenericProduct(slug)
    const product = data.product

    const sellers = [product, ...(data.comparable_products || [])].filter((p) => p.seller)
    const lowest = sellers.length ? Math.min(...sellers.map((s) => s.price)) : product.price
    const price = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: product.currency || "NGN",
      maximumFractionDigits: 0,
    }).format(lowest)

    const image =
      product.images?.find((i) => i.is_primary)?.url || product.images?.[0]?.url || null

    const badges: string[] = []
    if (product.rating_average) badges.push(`★ ${product.rating_average}`)
    if (sellers.length > 1) badges.push(`${sellers.length} sellers`)
    if (product.is_authentic_only) badges.push("Authentic only")

    return brandOgImage({
      eyebrow: product.category?.name || product.brand || "Marketplace",
      title: product.name,
      subtitle: `From ${price}`,
      imageUrl: image,
      badges,
    })
  } catch {
    return brandOgImage({ eyebrow: "Marketplace", title: "Banex Mall", subtitle: "Shop, delivered in an hour" })
  }
}
