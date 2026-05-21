"use client"

import Link from "next/link"
import { Star, MapPin, Heart } from "lucide-react"
import { motion } from "framer-motion"
import { formatNaira, type Product } from "@/lib/products"
import { getCategory } from "@/lib/categories"

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const lowest = Math.min(...product.sellers.map((s) => s.price))
  const topSeller = [...product.sellers].sort((a, b) => a.price - b.price)[0]
  const categoryName = getCategory(product.categorySlug)?.name ?? product.categorySlug
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
        <div className="relative aspect-square overflow-hidden bg-surface">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            width={900}
            height={900}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-deep backdrop-blur">
            {categoryName}
          </span>
          <button
            aria-label="Save"
            onClick={(e) => e.preventDefault()}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/90 text-muted-foreground backdrop-blur transition-colors hover:text-brand"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{product.brand}</p>
          <h3 className="mt-0.5 line-clamp-1 font-display text-base font-semibold text-foreground">{product.name}</h3>

          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-brand text-brand" />
            <span className="font-semibold text-foreground">{product.rating}</span>
            <span>({product.reviews.toLocaleString()})</span>
            <span className="ml-auto rounded-full bg-brand-soft/25 px-2 py-0.5 text-[10px] font-semibold text-brand-deep">
              {product.sellers.length} sellers
            </span>
          </div>

          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">From</p>
              <p className="font-display text-xl font-bold text-foreground">{formatNaira(lowest)}</p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3" /> {topSeller.location}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
