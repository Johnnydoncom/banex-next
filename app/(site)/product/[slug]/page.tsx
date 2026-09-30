import Link from "next/link"
import { notFound } from "next/navigation"
import { fetchGenericProduct } from "@/lib/generic-api"
import { ProductDetailView } from "./components/ProductDetailView"
import { RecentlyViewedProducts } from "./components/RecentlyViewedProducts"
import { ProductSellerCard } from "./components/ProductSellerCard"
import type { Metadata } from "next"
import { buildMetadata, metadataFromApiSeo } from "@/lib/seo/metadata"
import { JsonLd } from "@/lib/seo/JsonLdComponent"
import { productSchema, breadcrumbSchema } from "@/lib/seo/jsonld"

/** Strip HTML tags for a clean meta description. */
function plainText(html?: string | null) {
  if (!html) return undefined
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params
    const data = await fetchGenericProduct(slug)
    const product = data.product
    if (!product) return buildMetadata({ title: "Listing not found", path: `/product/${slug}`, noindex: true })
    const price = new Intl.NumberFormat("en-NG", { style: "currency", currency: product.currency || "NGN", maximumFractionDigits: 0 }).format(product.price)
    const primaryImg = product.images?.find((i) => i.is_primary)?.url || product.images?.[0]?.url
    // Prefer the API's ready-to-render seo; fall back to computed copy when absent.
    return metadataFromApiSeo(data.seo, {
      title: product.name,
      description:
        plainText(product.description) ||
        `Buy ${product.name}${product.brand ? ` by ${product.brand}` : ""} from ${price} on Banex Mall — escrow protected, same-hour rider delivery.`,
      path: `/product/${product.slug}`,
      ogType: "product",
      images: [primaryImg],
    })
  } catch {
    return buildMetadata({ title: "Product", path: "/shop", noindex: true })
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  let data
  try {
    const resolvedParams = await params
    data = await fetchGenericProduct(resolvedParams.slug)
  } catch (err) {
    notFound()
  }

  if (!data?.product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <h1 className="font-display text-4xl">Listing not found</h1>
        <Link href="/shop" className="mt-4 text-brand hover:underline">
          ← Back to marketplace
        </Link>
      </div>
    )
  }

  const { product } = data
  // Other sellers offering the same product (empty in the single-seller model).
  const comparableProducts = data.comparable_products ?? []
  // Compare-sellers list = the main product + comparables, sorted by lowest price.
  const allSellers = [product, ...comparableProducts].filter((p) => p.seller)
  const sortedSellers = [...allSellers].sort((a, b) => a.price - b.price)
  // Banex Mall is the single seller — the product's own (effective) price is the price.
  const lowest = allSellers.length ? Math.min(...allSellers.map((p) => p.price)) : product.price

  // ── Structured data (Product + AggregateOffer + Breadcrumb) ──
  const productImages = (product.images || [])
    .slice()
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
    .map((img) => img.url)
  const jsonLd = [
    productSchema({
      name: product.name,
      slug: product.slug,
      description: product.description?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
      images: productImages,
      brand: product.brand,
      category: product.category?.name,
      currency: product.currency || "NGN",
      price: lowest,
      inStock: product.in_stock,
      ratingValue: product.rating_average,
      reviewCount: product.reviews_count,
      sellers: [{ name: "Banex Mall", price: product.price }],
    }),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Shop", path: "/shop" },
      ...(product.category
        ? [{ name: product.category.name, path: `/shop/${product.category.slug}` }]
        : []),
      { name: product.name, path: `/product/${product.slug}` },
    ]),
  ]

  return (
    <div>
      <JsonLd schema={jsonLd} />
      {/* Gallery, price + variants, contact, specifications and description —
          shared with the admin product preview. */}
      <ProductDetailView product={product} />

      {/* Compare sellers — same product from other sellers. Renders only when there
          is more than one seller (hidden in the current single-seller model; appears
          automatically once the API returns comparable_products). */}
      {sortedSellers.length > 1 && (
        <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-deep">Compare sellers</p>
              <h2 className="mt-2 font-display text-2xl font-bold md:text-3xl">
                {sortedSellers.length} sellers · contact or buy
              </h2>
            </div>
            <p className="hidden text-xs text-muted-foreground md:block">Sorted by lowest price</p>
          </div>

          <div className="mt-6 space-y-3">
            {sortedSellers.map((sellerProduct, i) => (
              <ProductSellerCard
                key={sellerProduct.seller?.id || i}
                product={product}
                sellerProduct={sellerProduct}
                isBestPrice={sellerProduct.price === lowest}
                index={i}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recently viewed (viewer-scoped; fetched client-side) */}
      <RecentlyViewedProducts slug={product.slug} currentId={product.id} />

    </div>
  )
}
