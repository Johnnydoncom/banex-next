"use client"

import Link from "next/link"
import { Heart, Trash2, ShoppingBag } from "lucide-react"
import { useCart } from "@/components/CartContext"
import { useWishlist, type WishlistItem } from "@/components/WishlistContext"
import { toast } from "sonner"
import Image from "next/image"

export default function WishlistPage() {
  const cart = useCart()
  const { items, remove, isSyncing } = useWishlist()
  const handleRemove = async (productId: string) => {
    await remove(productId)
  }

  const moveToCart = (i: WishlistItem) => {
    cart.add({
      id: `${i.productId}-${i.sellerId ?? "vendor"}`,
      productId: i.productId,
      productSlug: i.productSlug,
      productName: i.productName,
      productImage: i.productImage ?? "",
      sellerId: i.sellerId ?? "vendor",
      sellerName: i.sellerName ?? "Vendor",
      price: Number(i.price),
    })
    toast.success("Added to cart")
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Wishlist</h1>
        <p className="text-sm text-muted-foreground">Saved items you want to revisit.</p>
      </div>

      {isSyncing ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Heart className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-2 font-semibold">Your wishlist is empty</p>
          <p className="mt-1 text-xs text-muted-foreground">Tap the heart icon on any product to save it.</p>
          <Link href="/shop" className="mt-4 inline-flex rounded-full bg-gradient-brand px-4 py-2 text-xs font-semibold text-primary-foreground">Browse the mall</Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <li key={i.productId} className="group overflow-hidden rounded-2xl border border-border bg-card">
              <div className="aspect-[4/3] overflow-hidden bg-surface relative">
                {i.productImage && (
                  <Image src={i.productImage} alt={i.productName} fill className="object-cover transition-transform group-hover:scale-105" />
                )}
              </div>
              <div className="p-3.5">
                <p className="truncate text-sm font-semibold">{i.productName}</p>
                <p className="mt-0.5 text-sm font-bold text-brand-deep">₦{Number(i.price).toLocaleString()}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => moveToCart(i)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-brand px-3 py-2 text-xs font-semibold text-primary-foreground"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" /> Add to cart
                  </button>
                  <button
                    onClick={() => handleRemove(i.productId)}
                    aria-label="Remove"
                    className="rounded-full border border-border bg-card p-2 text-muted-foreground hover:border-rose-500 hover:text-rose-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
