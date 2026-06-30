"use client"

import { useRouter } from "next/navigation"
import { ShoppingBag, Lock, Heart } from "lucide-react"
import { useCart } from "@/components/CartContext"
import { useWishlist } from "@/components/WishlistContext"
import { toast } from "sonner"
import type { GenericProduct } from "@/lib/generic-api"

interface ProductActionButtonsProps {
  product: GenericProduct
}

export function ProductActionButtons({ product }: ProductActionButtonsProps) {
  const router = useRouter()
  const { add, open } = useCart()
  const { isInWishlist, toggle } = useWishlist()
  
  const saved = isInWishlist(product.id)

  // Safely grab the primary image
  const primaryImg = product.images?.find((img) => img.is_primary)?.url || product.images?.[0]?.url || ""
  const sellerId = product.seller?.id || "unknown"
  const sellerName = product.seller?.shop_name || "Unknown Seller"

  const addToCart = () => {
    add({
      id: `${product.id}-${sellerId}`,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      productImage: primaryImg,
      sellerId: sellerId,
      sellerName: sellerName,
      price: product.price,
    })
    toast.success(`Added to cart from ${sellerName}`)
    open()
  }

  const buyNow = () => {
    add({
      id: `${product.id}-${sellerId}`,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      productImage: primaryImg,
      sellerId: sellerId,
      sellerName: sellerName,
      price: product.price,
    })
    router.push("/checkout")
  }

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      <button
        onClick={buyNow}
        className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-3 text-sm font-semibold text-primary-foreground"
      >
        <Lock className="h-4 w-4" /> Buy with escrow
      </button>
      <button
        onClick={addToCart}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:border-brand hover:text-brand"
      >
        <ShoppingBag className="h-4 w-4" /> Add to cart
      </button>
      <button
        onClick={() => toggle(product)}
        className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition-colors ${
          saved
            ? "border-brand bg-brand-soft/20 text-brand"
            : "border-border bg-card hover:border-brand hover:text-brand"
        }`}
      >
        <Heart className={`h-4 w-4 ${saved ? "fill-brand" : ""}`} />
        {saved ? "Saved to wishlist" : "Save to wishlist"}
      </button>
    </div>
  )
}
