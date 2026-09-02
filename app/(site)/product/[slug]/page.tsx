import Link from "next/link"
import { notFound } from "next/navigation"
import { Star, Truck, ShieldCheck, BadgeCheck, ChevronLeft } from "lucide-react"
import { fetchGenericProduct } from "@/lib/generic-api"
import { ProductImageGallery } from "./components/ProductImageGallery"
import { ProductPurchasePanel } from "./components/ProductPurchasePanel"
import { ProductSellerCard } from "./components/ProductSellerCard"
import { ProductContactButtons } from "./components/ProductContactButtons"
import { ProductDescription } from "./components/ProductDescription"
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
      <div className="mx-auto max-w-7xl px-4 pt-4 md:px-8">
        <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand">
          <ChevronLeft className="h-4 w-4" /> Back to marketplace
        </Link>
      </div>

      <section className="mx-auto grid grid-cols-1 max-w-7xl gap-10 px-4 py-4 md:grid-cols-2 md:px-8 md:pb-12">
        <ProductImageGallery images={product.images || []} name={product.name} />

        <div>
          <p className="text-xs uppercase tracking-widest text-brand-deep">
            {product.brand} · {product.category?.name || "Uncategorized"}
          </p>
          <h1 className="mt-3 font-display text-xl font-bold leading-snug break-words sm:text-2xl md:text-4xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-brand text-brand" />
            <span className="text-foreground">{product.rating_average || "0.0"}</span>
            <span>· {(product.reviews_count || 0).toLocaleString()} reviews</span>
          </div>

          {/* Price + variant selection + actions (client — price reflects the selected variant) */}
          <ProductPurchasePanel product={product} />

          {/* Contact Banex Mall about this listing */}
          <ProductContactButtons product={product} />

          <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-6 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-brand" /> Escrow protected
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5">
              <Truck className="h-3.5 w-3.5 text-brand" /> Nationwide delivery
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5">
              <BadgeCheck className="h-3.5 w-3.5 text-brand" /> Authentic only
            </span>
          </div>
        </div>
      </section>

      {/* Specifications */}
      {product.specifications && product.specifications.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
          <h2 className="mb-6 font-display text-xl font-bold md:text-2xl">Specifications</h2>
          <dl className="grid grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-2 lg:grid-cols-3">
            {product.specifications.map((spec, i) => {
              const [k, v] = spec.split("=>").map((s) => s.trim())
              return (
                <div key={i} className="border-b border-border p-4 last:border-b-0 sm:[&:nth-last-child(-n+1)]:border-b-0 md:even:border-l">
                  <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{k || "Detail"}</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">{v || spec}</dd>
                </div>
              )
            })}
          </dl>
        </section>
      )}

      {/* Product Description */}
      <section className="mx-auto max-w-7xl px-4 pb-12 md:px-8">
        <h2 className="mb-6 font-display text-xl font-bold md:text-2xl">Product Overview</h2>
        <ProductDescription html={product.description || null} />
      </section>

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

    </div>
  )
}
