"use client"

import { Heart } from "lucide-react"
import { useWishlist } from "./WishlistContext"
import type { GenericProduct } from "@/lib/generic-api"
import { cn } from "@/lib/utils"

export function WishlistButton({ product, className }: { product: GenericProduct, className?: string }) {
  const { isInWishlist, toggle } = useWishlist()
  const active = isInWishlist(product.id)

  return (
    <button
      aria-label="Save to Wishlist"
      onClick={(e) => {
        e.preventDefault()
        void toggle(product)
      }}
      className={cn(
        "absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/90 backdrop-blur transition-colors",
        active ? "text-brand hover:text-brand" : "text-muted-foreground hover:text-brand",
        className
      )}
    >
      <Heart className={`h-4 w-4 ${active ? "fill-brand" : ""}`} />
    </button>
  )
}
