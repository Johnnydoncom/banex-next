import Link from "next/link"
import { notFound } from "next/navigation"
import { Star, Truck, ShieldCheck, BadgeCheck, ChevronLeft } from "lucide-react"
import { fetchGenericProduct } from "@/lib/generic-api"
import { ProductImageGallery } from "./components/ProductImageGallery"
import { ProductActionButtons } from "./components/ProductActionButtons"
import { ProductSellerCard } from "./components/ProductSellerCard"
import { ProductDescription } from "./components/ProductDescription"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const resolvedParams = await params
    const data = await fetchGenericProduct(resolvedParams.slug)
    const product = data.product
    if (!product) return {}
    const primaryImg = product.images?.find((img) => img.is_primary)?.url || product.images?.[0]?.url || ""
    return {
      title: `${product.name} | Banex Mall`,
      description: product.description || `Buy ${product.name} on Banex Mall`,
      openGraph: {
        images: primaryImg ? [primaryImg] : [],
      },
    }
  } catch (err) {
    return {}
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

  const { product, comparable_products } = data
  // Combine main product and comparables to form the seller list.
  const allSellers = [product, ...comparable_products].filter((p) => p.seller)
  const sortedSellers = allSellers.sort((a, b) => a.price - b.price)
  const lowest = sortedSellers[0]?.price || product.price

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 pt-6 md:px-8">
        <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand">
          <ChevronLeft className="h-4 w-4" /> Back to marketplace
        </Link>
      </div>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-8 md:grid-cols-2 md:px-8 md:py-12">
        <ProductImageGallery images={product.images || []} name={product.name} />

        <div>
          <p className="text-xs uppercase tracking-widest text-brand-deep">
            {product.brand} · {product.category?.name || "Uncategorized"}
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold md:text-5xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-brand text-brand" />
            <span className="text-foreground">{product.rating_average || "0.0"}</span>
            <span>· {(product.reviews_count || 0).toLocaleString()} reviews</span>
          </div>

          <div className="mt-6 flex items-end gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Lowest price</p>
              <p className="font-display text-3xl font-bold text-foreground md:text-4xl">{formatNaira(lowest)}</p>
            </div>
            <span className="rounded-full border border-brand/40 bg-brand-soft/20 px-3 py-1 text-xs font-medium text-brand-deep">
              {allSellers.length} sellers
            </span>
          </div>

          {/* Action buttons (client interactivity extracted) */}
          <ProductActionButtons product={sortedSellers[0] || product} />

          <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-border pt-6 text-sm sm:grid-cols-4">
            {product.specifications?.map((spec, i) => {
              const [k, v] = spec.split("=>").map((s) => s.trim())
              return (
                <div key={i}>
                  <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{k || "Detail"}</dt>
                  <dd className="mt-1 text-foreground">{v || spec}</dd>
                </div>
              )
            })}
          </dl>

          <div className="mt-6 flex flex-wrap gap-2 text-xs text-muted-foreground">
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

      {/* Product Description */}
      <section className="mx-auto max-w-7xl px-4 pb-12 md:px-8">
        <h2 className="mb-6 font-display text-xl font-bold md:text-2xl">Product Overview</h2>
        <ProductDescription html={product.description || null} />
      </section>


      {/* Seller comparison + contact */}
      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-deep">Compare sellers</p>
            <h2 className="mt-2 font-display text-2xl font-bold md:text-3xl">
              {allSellers.length} sellers · contact, bid or buy
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

    </div>
  )
}
