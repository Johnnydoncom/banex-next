"use client"

import { Bike } from "lucide-react"
import { useCart } from "@/components/CartContext"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { GenericProduct, GenericSeller } from "@/lib/generic-api"
import { Button } from "@/components/ui/button"

export function VendorOrderAll({ items, vendor }: { items: GenericProduct[]; vendor: GenericSeller }) {
  const { add } = useCart()
  const router = useRouter()

  const orderAll = () => {
    if (!items.length) return
    const item = items[0]
    add({
      id: `${item.id}-${vendor.id}`,
      productId: item.id,
      productSlug: item.slug,
      productName: item.name,
      productImage: item.images?.[0]?.url || "",
      sellerId: vendor.id,
      sellerName: vendor.shop_name,
      price: item.price,
    })
    router.push("/checkout")
  }

  return (
    <Button variant="ghost" type="button"
      onClick={orderAll}
      disabled={!items.length}
      className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
    >
      <Bike className="h-4 w-4" /> Order from this shop
    </Button>
  )
}

export function VendorQuickOrder({ item, vendor }: { item: GenericProduct; vendor: GenericSeller }) {
  const { add, open } = useCart()

  const orderInStore = () => {
    add({
      id: `${item.id}-${vendor.id}`,
      productId: item.id,
      productSlug: item.slug,
      productName: item.name,
      productImage: item.images?.[0]?.url || "",
      sellerId: vendor.id,
      sellerName: vendor.shop_name,
      price: item.price,
    })
    toast.success(`Added · rider ETA ${vendor.delivery_estimate_minutes || 30} min`)
    open()
  }

  return (
    <Button variant="ghost" type="button"
      onClick={orderInStore}
      className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-gradient-brand px-3 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-soft"
    >
      <Bike className="h-3 w-3" /> Quick order
    </Button>
  )
}
