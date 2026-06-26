import Link from "next/link"
import { MapPin, Star } from "lucide-react"
import { GenericProduct } from "@/lib/generic-api"

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount)
}

export function ApiProductCard({ product }: { product: GenericProduct }) {
  const primaryImage = product.images?.find((i) => i.is_primary) ?? product.images?.[0]

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group relative block overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/60 hover:shadow-brand"
    >
      <div className="relative aspect-square overflow-hidden bg-surface">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={product.name}
            loading="lazy"
            width={600}
            height={600}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-brand-soft/20" />
        )}
        {product.category && (
          <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-deep backdrop-blur">
            {product.category.name}
          </span>
        )}
        {product.is_authentic_only && (
          <span className="absolute right-3 top-3 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
            Authentic
          </span>
        )}
      </div>

      <div className="p-4">
        {product.brand && (
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{product.brand}</p>
        )}
        <h3 className="mt-0.5 line-clamp-1 font-display text-base font-semibold text-foreground">
          {product.name}
        </h3>

        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3 w-3 fill-brand text-brand" />
          <span className="font-semibold text-foreground">
            {product.rating_average != null ? product.rating_average.toFixed(1) : "New"}
          </span>
          <span>({product.reviews_count})</span>
          {!product.in_stock && (
            <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
              Out of stock
            </span>
          )}
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Price</p>
            <p className="font-display text-xl font-bold text-foreground">{formatNaira(product.price)}</p>
          </div>
          {product.location && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3" /> {product.location}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
