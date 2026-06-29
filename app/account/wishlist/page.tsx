"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Heart, Trash2, ShoppingBag } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/components/CartContext"
import { toast } from "sonner"
import Image from "next/image"

type Item = {
  id: string
  product_slug: string
  product_name: string
  product_image: string | null
  product_price: number
  vendor_slug: string | null
}

export default function WishlistPage() {
  const { user, session } = useAuth()
  const cart = useCart()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!user) return
    setLoading(true)

    try {
      const token = (session as any)?.accessToken
      if (!token) return
      const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" }
      
      const res = await fetch(`/api/proxy/user/wishlists`, { headers })
      const data = await res.json()
      
      // The API usually returns the array either directly in data.data or data.data.wishlists
      const wishlists = data?.data?.wishlists || data?.data || []
      
      // Ensure we map to the expected structure if the backend returns a different format
      const formattedItems = Array.isArray(wishlists) ? wishlists.map((w: any) => ({
        id: w.id,
        product_slug: w.product?.slug || w.product_slug,
        product_name: w.product?.name || w.product_name,
        product_image: w.product?.images?.[0]?.url || w.product?.image_url || w.product_image,
        product_price: w.product?.price || w.product_price,
        vendor_slug: w.product?.seller?.slug || w.vendor_slug || null
      })) : []
      
      setItems(formattedItems)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [user, session])

  const remove = async (id: string) => {
    try {
      const token = (session as any)?.accessToken
      const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" }
      
      await fetch(`/api/proxy/user/wishlists/${id}`, { method: 'DELETE', headers })
    } catch (err) {
      console.error(err)
    }

    setItems((prev) => prev.filter((i) => i.id !== id))
    toast.success("Removed from wishlist")
  }

  const moveToCart = (i: Item) => {
    cart.add({
      id: `${i.product_slug}-${i.vendor_slug ?? "vendor"}`,
      productId: i.product_slug,
      productSlug: i.product_slug,
      productName: i.product_name,
      productImage: i.product_image ?? "",
      sellerId: i.vendor_slug ?? "vendor",
      sellerName: i.vendor_slug ?? "Vendor",
      price: Number(i.product_price),
    })
    toast.success("Added to cart")
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Wishlist</h1>
        <p className="text-sm text-muted-foreground">Saved items you want to revisit.</p>
      </div>

      {loading ? (
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
            <li key={i.id} className="group overflow-hidden rounded-2xl border border-border bg-card">
              <div className="aspect-[4/3] overflow-hidden bg-surface relative">
                {i.product_image && (
                  <Image src={i.product_image} alt={i.product_name} fill className="object-cover transition-transform group-hover:scale-105" />
                )}
              </div>
              <div className="p-3.5">
                <p className="truncate text-sm font-semibold">{i.product_name}</p>
                <p className="mt-0.5 text-sm font-bold text-brand-deep">₦{Number(i.product_price).toLocaleString()}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => moveToCart(i)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-brand px-3 py-2 text-xs font-semibold text-primary-foreground"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" /> Add to cart
                  </button>
                  <button
                    onClick={() => remove(i.id)}
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
