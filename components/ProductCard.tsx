"use client"

import Link from "next/link"
import { Star, MapPin, Heart } from "lucide-react"
import { motion } from "framer-motion"
import { GenericProduct } from "@/lib/generic-api"
import { useWishlist } from "@/components/WishlistContext"
import { Button } from "@/components/ui/button"

export function ProductCard({ product, index = 0 }: { product: GenericProduct; index?: number }) {
  const { isInWishlist, toggle } = useWishlist()
  
  const lowest = product.price
  const categoryName = product.category?.name || "Uncategorized"
  const primaryImg = product.images?.find((img) => img.is_primary)?.url || product.images?.[0]?.url || ""

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
    >
      <Link
        href={`/product/${product.slug}`}
        className="group relative block overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/60 hover:shadow-brand"
      >
        <div className="relative aspect-square overflow-hidden bg-surface flex items-center justify-center">
          {primaryImg ? (
            <img
              src={primaryImg}
              alt={product.name}
              loading="lazy"
              width={900}
              height={900}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="text-muted-foreground text-xs">No image</span>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-deep backdrop-blur">
            {categoryName}
          </span>
          <Button variant="ghost" type="button"
            aria-label="Save"
            onClick={(e) => {
              e.preventDefault()
              void toggle(product)
            }}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/90 text-muted-foreground backdrop-blur transition-colors hover:text-brand"
          >
            <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? "fill-brand text-brand" : ""}`} />
          </Button>
        </div>
        <div className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{product.brand || "Brand"}</p>
          <h3 className="mt-0.5 line-clamp-1 font-display text-base font-semibold text-foreground">{product.name}</h3>

          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-brand text-brand" />
            <span className="font-semibold text-foreground">{product.rating_average || "0.0"}</span>
            <span>({(product.reviews_count || 0).toLocaleString()})</span>
          </div>

          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Price</p>
              <p className="font-display text-xl font-bold text-foreground">{formatNaira(lowest)}</p>
            </div>
            {product.location && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3" /> {product.location}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
