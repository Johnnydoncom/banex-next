"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Truck, Phone, Lock, ShoppingBag, MessageCircle, FileText } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useCart } from "@/components/CartContext"
import type { GenericProduct } from "@/lib/generic-api"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

// Helper formatter
const formatNaira = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount)
}

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

  const [quoteOpen, setQuoteOpen] = useState(false)
  const [quoteText, setQuoteText] = useState("")

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

  const addToCart = () => {
    add({
      id: `${sellerProduct.id}-${s.id}`,
      productId: sellerProduct.id,
      productSlug: sellerProduct.slug,
      productName: sellerProduct.name,
      productImage: primaryImg,
      sellerId: s.id,
      sellerName: s.shop_name,
      price: sellerProduct.price,
    })
    toast.success(`Added to cart from ${s.shop_name}`)
    open()
  }

  const buyNow = () => {
    add({
      id: `${sellerProduct.id}-${s.id}`,
      productId: sellerProduct.id,
      productSlug: sellerProduct.slug,
      productName: sellerProduct.name,
      productImage: primaryImg,
      sellerId: s.id,
      sellerName: s.shop_name,
      price: sellerProduct.price,
    })
    router.push("/checkout")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-2xl border bg-card p-5 transition-colors ${
        isBestPrice ? "border-brand/60 shadow-soft" : "border-border"
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-base font-semibold">{s.shop_name}</p>
            {/* If backend adds verified to product.seller, use it here */}
            {isBestPrice && (
              <span className="rounded-full bg-gradient-brand px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                Best price
              </span>
            )}
          </div>
          {/* location, reviews_count and rating_average removed as they are not on product.seller */}
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
          <p className="font-display text-2xl font-bold text-foreground">{formatNaira(sellerProduct.price)}</p>
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
            <Button variant="ghost" type="button"
              onClick={() => {
                setQuoteOpen(!quoteOpen)
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium hover:border-brand hover:text-brand"
            >
              <FileText className="h-3.5 w-3.5" /> Quote
            </Button>
          </div>
        </div>
      </div>

      {quoteOpen && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            toast.success(`Quote request sent to ${s.shop_name}`)
            setQuoteOpen(false)
            setQuoteText("")
          }}
          className="mt-4 grid gap-2 rounded-xl border border-border bg-surface/40 p-4"
        >
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-brand-deep">
              Request a quote
            </span>
            <Textarea
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              placeholder="Quantity, customisation, delivery date…"
              rows={3}
              className="mt-1 w-full rounded-2xl border border-border bg-background p-3 text-sm outline-none focus:border-brand"
            />
          </label>
          <Button variant="ghost"
            type="submit"
            className="self-start rounded-full bg-gradient-brand px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            Send request
          </Button>
        </form>
      )}
    </motion.div>
  )
}
