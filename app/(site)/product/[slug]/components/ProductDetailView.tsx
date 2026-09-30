import Link from "next/link"
import { Star, Truck, ShieldCheck, BadgeCheck, ChevronLeft } from "lucide-react"
import type { GenericProduct } from "@/lib/generic-api"
import { ProductImageGallery } from "./ProductImageGallery"
import { ProductPurchasePanel } from "./ProductPurchasePanel"
import { ProductContactButtons } from "./ProductContactButtons"
import { ProductDescription } from "./ProductDescription"

/**
 * The product page body exactly as shoppers see it: gallery, price + variants,
 * contact actions, specifications and description. Rendered by the storefront
 * product page AND by the admin product preview, so the two can't drift apart.
 *
 * `preview` keeps it inert — no navigation away, nothing added to cart/wishlist.
 */
export function ProductDetailView({ product, preview = false }: { product: GenericProduct; preview?: boolean }) {
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-4 md:px-8">
        {preview ? (
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <ChevronLeft className="h-4 w-4" /> Back to marketplace
          </span>
        ) : (
          <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand">
            <ChevronLeft className="h-4 w-4" /> Back to marketplace
          </Link>
        )}
      </div>

      <section className="mx-auto grid grid-cols-1 max-w-7xl gap-10 px-4 py-4 md:grid-cols-2 md:px-8 md:pb-12">
        <ProductImageGallery images={product.images || []} name={product.name} />

        <div>
          <p className="text-xs uppercase tracking-widest text-brand-deep">
            {[product.brand, product.category?.name || "Uncategorized"].filter(Boolean).join(" · ")}
          </p>
          <h1 className="mt-3 font-display text-xl font-bold leading-snug break-words sm:text-2xl md:text-4xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-brand text-brand" />
            <span className="text-foreground">{product.rating_average || "0.0"}</span>
            <span>· {(product.reviews_count || 0).toLocaleString()} reviews</span>
          </div>

          {/* Price + variant selection + actions (client — price reflects the selected variant) */}
          <ProductPurchasePanel product={product} preview={preview} />

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
    </>
  )
}
