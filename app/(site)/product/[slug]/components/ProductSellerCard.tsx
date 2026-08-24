"use client"

import { motion } from "framer-motion"
import { Truck, Phone, Lock, ShoppingBag, MessageCircle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useCart } from "@/components/CartContext"
import type { GenericProduct } from "@/lib/generic-api"
import { formatNaira, saleInfo } from "@/lib/products"
import { Button } from "@/components/ui/button"

// Format a raw digits phone (e.g. "2349073934379") for display.
const formatPhone = (digits: string) => {
  const d = digits.startsWith("234") ? `+${digits}` : digits.startsWith("+") ? digits : `+${digits}`
  return d
}

interface ProductSellerCardProps {
  product: GenericProduct
  sellerProduct: GenericProduct
  isBestPrice: boolean
  index: number
}

export function ProductSellerCard({ product, sellerProduct, isBestPrice, index }: ProductSellerCardProps) {
  const router = useRouter()
  const { add, open } = useCart()

  const s = sellerProduct.seller
  if (!s) return null

  // Contact channel = the seller's assigned WhatsApp contact (digits only). When
  // no contact is assigned the API returns null → hide the chat/call options.
  const whatsappDigits = (s.whatsapp || "").replace(/[^\d]/g, "")
  const hasContact = whatsappDigits.length > 0
  const waLink = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
    `Hi ${s.shop_name}, I'm interested in your "${sellerProduct.name}" listing on Banex Mall.`,
  )}`

  const primaryImg = sellerProduct.images?.find((img) => img.is_primary)?.url || sellerProduct.images?.[0]?.url || ""
  const sale = saleInfo(sellerProduct)

  const line = () => ({
    id: `${sellerProduct.id}-${s.id}`,
    productId: sellerProduct.id,
    productVariantId: sellerProduct.variants?.find((v) => v.is_default)?.id ?? null,
    variantAttributes: null,
    productSlug: sellerProduct.slug,
    productName: sellerProduct.name,
    productImage: primaryImg,
    sellerId: s.id,
    sellerName: s.shop_name,
    price: sellerProduct.price,
  })

  const addToCart = () => {
    add(line())
    toast.success(`Added to cart from ${s.shop_name}`)
    open()
  }

  const buyNow = () => {
    add(line())
    router.push("/checkout")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-2xl border bg-card p-5 transition-colors ${isBestPrice ? "border-brand/60 shadow-soft" : "border-border"}`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-base font-semibold">{s.shop_name}</p>
            {isBestPrice && (
              <span className="rounded-full bg-gradient-brand px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                Best price
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            <Truck className="mr-1 inline h-3 w-3" /> Delivery: {sellerProduct.delivery_estimate || "3-5 days"}
          </p>
          {hasContact && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" /> {formatPhone(whatsappDigits)}
            </p>
          )}
        </div>

        <div className="flex flex-col items-start md:items-end">
          <div className="flex items-baseline gap-2">
            <p className="font-display text-2xl font-bold text-foreground">{formatNaira(sellerProduct.price)}</p>
            {sale.onSale && (
              <span className="text-sm font-medium text-muted-foreground line-through">{formatNaira(sale.original!)}</span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="ghost" type="button"
              onClick={buyNow}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-brand px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              <Lock className="h-3.5 w-3.5" /> Buy (escrow)
            </Button>
            <Button variant="ghost" type="button"
              onClick={addToCart}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium hover:border-brand hover:text-brand"
            >
              <ShoppingBag className="h-3.5 w-3.5" /> Add
            </Button>
            {hasContact && (
              <>
                <a
                  href={`tel:+${whatsappDigits}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium hover:border-brand hover:text-brand"
                >
                  <Phone className="h-3.5 w-3.5" /> Call
                </a>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Chat on WhatsApp
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
