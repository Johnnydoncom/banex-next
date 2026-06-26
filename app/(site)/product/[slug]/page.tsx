"use client"

import Link from "next/link"
import { useParams, notFound, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Star,
  Truck,
  ShieldCheck,
  BadgeCheck,
  ChevronLeft,
  Check,
  Phone,
  MessageCircle,
  FileText,
  Gavel,
  ShoppingBag,
  Lock,
} from "lucide-react"
import { useState } from "react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { formatNaira, getProductBySlug, type Seller } from "@/lib/products"
import { getCategory } from "@/lib/categories"
import { useCart } from "@/components/CartContext"
import { toast } from "sonner"

const sellerPhone = (sellerId: string) => {
  // Demo phone derived from id; in production this would come from the DB
  const tail = (sellerId.length * 13) % 10000
  return `+234 80 ${String(tail).padStart(4, "0")} 12${sellerId.length}${sellerId.length}`
}

export default function ProductPage() {
  const params = useParams()
  const slug = typeof params?.slug === "string" ? params.slug : ""
  const product = getProductBySlug(slug)
  const router = useRouter()

  const { add, open } = useCart()

  const [bidOpen, setBidOpen] = useState<string | null>(null)
  const [bidAmount, setBidAmount] = useState<number>(0)
  const [quoteOpen, setQuoteOpen] = useState<string | null>(null)
  const [quoteText, setQuoteText] = useState("")

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <h1 className="font-display text-4xl">Listing not found</h1>
        <Link href="/shop" className="mt-4 text-brand hover:underline">
          ← Back to marketplace
        </Link>
      </div>
    )
  }

  const sortedSellers = [...product.sellers].sort((a, b) => a.price - b.price)
  const lowest = sortedSellers[0].price

  const addToCart = (s: Seller) => {
    add({
      id: `${product.id}-${s.id}`,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      productImage: product.image,
      sellerId: s.id,
      sellerName: s.name,
      price: s.price,
    })
    toast.success(`Added to cart from ${s.name}`)
    open()
  }

  const buyNow = (s: Seller) => {
    add({
      id: `${product.id}-${s.id}`,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      productImage: product.image,
      sellerId: s.id,
      sellerName: s.name,
      price: s.price,
    })
    router.push("/checkout")
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="mx-auto max-w-7xl px-4 pt-6 md:px-8">
        <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand">
          <ChevronLeft className="h-4 w-4" /> Back to marketplace
        </Link>
      </div>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-8 md:grid-cols-2 md:px-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
            <img
              src={product.image}
              alt={product.name}
              width={900}
              height={900}
              className="h-full w-full object-cover"
            />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <p className="text-xs uppercase tracking-widest text-brand-deep">
            {product.brand} · {getCategory(product.categorySlug)?.name}
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold md:text-5xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-brand text-brand" />
            <span className="text-foreground">{product.rating}</span>
            <span>· {product.reviews.toLocaleString()} reviews</span>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

          <div className="mt-6 flex items-end gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Lowest price</p>
              <p className="font-display text-3xl font-bold text-foreground md:text-4xl">{formatNaira(lowest)}</p>
            </div>
            <span className="rounded-full border border-brand/40 bg-brand-soft/20 px-3 py-1 text-xs font-medium text-brand-deep">
              {product.sellers.length} sellers
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => buyNow(sortedSellers[0])}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              <Lock className="h-4 w-4" /> Buy with escrow
            </button>
            <button
              onClick={() => addToCart(sortedSellers[0])}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:border-brand hover:text-brand"
            >
              <ShoppingBag className="h-4 w-4" /> Add to cart
            </button>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-border pt-6 text-sm sm:grid-cols-4">
            {Object.entries(product.specs as Record<string, string>).map(([k, v]) => (
              <div key={k}>
                <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</dt>
                <dd className="mt-1 text-foreground">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-brand" /> Escrow protected
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5">
              <Truck className="h-3.5 w-3.5 text-brand" /> Nationwide delivery
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5">
              <BadgeCheck className="h-3.5 w-3.5 text-brand" /> Authentic only
            </span>
          </div>
        </motion.div>
      </section>

      {/* Seller comparison + contact */}
      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-deep">Compare sellers</p>
            <h2 className="mt-2 font-display text-2xl font-bold md:text-3xl">
              {product.sellers.length} sellers · contact, bid or buy
            </h2>
          </div>
          <p className="hidden text-xs text-muted-foreground md:block">Sorted by lowest price</p>
        </div>

        <div className="mt-6 space-y-3">
          {sortedSellers.map((s, i) => {
            const best = s.price === lowest
            const phone = sellerPhone(s.id)
            const waLink = `https://wa.me/${phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
              `Hi ${s.name}, I'm interested in your "${product.name}" listing on Banex Mall.`,
            )}`
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-2xl border bg-card p-5 transition-colors ${
                  best ? "border-brand/60 shadow-soft" : "border-border"
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-base font-semibold">{s.name}</p>
                      {s.verified && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-brand/40 bg-brand-soft/20 px-2 py-0.5 text-[10px] font-medium text-brand-deep">
                          <Check className="h-2.5 w-2.5" /> Verified
                        </span>
                      )}
                      {best && (
                        <span className="rounded-full bg-gradient-brand px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                          Best price
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.location} · {s.reviews.toLocaleString()} reviews · ⭐ {s.rating}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <Truck className="mr-1 inline h-3 w-3" /> Delivery: {s.delivery}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /> {phone}
                    </p>
                  </div>

                  <div className="flex flex-col items-start md:items-end">
                    <p className="font-display text-2xl font-bold text-foreground">{formatNaira(s.price)}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => buyNow(s)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-gradient-brand px-4 py-2 text-xs font-semibold text-primary-foreground"
                      >
                        <Lock className="h-3.5 w-3.5" /> Buy (escrow)
                      </button>
                      <button
                        onClick={() => addToCart(s)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium hover:border-brand hover:text-brand"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" /> Add
                      </button>
                      <a
                        href={`tel:${phone.replace(/\s/g, "")}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium hover:border-brand hover:text-brand"
                      >
                        <Phone className="h-3.5 w-3.5" /> Call
                      </a>
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium hover:border-brand hover:text-brand"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> Chat
                      </a>
                      <button
                        onClick={() => {
                          setQuoteOpen(quoteOpen === s.id ? null : s.id)
                          setBidOpen(null)
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium hover:border-brand hover:text-brand"
                      >
                        <FileText className="h-3.5 w-3.5" /> Quote
                      </button>
                      <button
                        onClick={() => {
                          setBidOpen(bidOpen === s.id ? null : s.id)
                          setBidAmount(Math.round(s.price * 0.9))
                          setQuoteOpen(null)
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium hover:border-brand hover:text-brand"
                      >
                        <Gavel className="h-3.5 w-3.5" /> Make offer
                      </button>
                    </div>
                  </div>
                </div>

                {bidOpen === s.id && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      toast.success(`Offer of ${formatNaira(bidAmount)} sent to ${s.name}`)
                      setBidOpen(null)
                    }}
                    className="mt-4 grid gap-2 rounded-xl border border-border bg-surface/40 p-4 sm:grid-cols-[1fr_auto]"
                  >
                    <label className="block">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-brand-deep">
                        Your offer
                      </span>
                      <input
                        type="number"
                        min={1000}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(Number(e.target.value))}
                        className="mt-1 h-11 w-full rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-brand"
                      />
                    </label>
                    <button
                      type="submit"
                      className="self-end rounded-full bg-gradient-brand px-5 py-3 text-sm font-semibold text-primary-foreground"
                    >
                      Send offer
                    </button>
                  </form>
                )}

                {quoteOpen === s.id && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      toast.success(`Quote request sent to ${s.name}`)
                      setQuoteOpen(null)
                      setQuoteText("")
                    }}
                    className="mt-4 grid gap-2 rounded-xl border border-border bg-surface/40 p-4"
                  >
                    <label className="block">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-brand-deep">
                        Request a quote
                      </span>
                      <textarea
                        value={quoteText}
                        onChange={(e) => setQuoteText(e.target.value)}
                        placeholder="Quantity, customisation, delivery date…"
                        rows={3}
                        className="mt-1 w-full rounded-2xl border border-border bg-background p-3 text-sm outline-none focus:border-brand"
                      />
                    </label>
                    <button
                      type="submit"
                      className="self-start rounded-full bg-gradient-brand px-5 py-3 text-sm font-semibold text-primary-foreground"
                    >
                      Send request
                    </button>
                  </form>
                )}
              </motion.div>
            )
          })}
        </div>
      </section>

      <Footer />
    </div>
  )
}
