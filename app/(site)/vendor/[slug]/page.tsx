"use client"

import Link from "next/link"
import { useParams, notFound, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Star, Bike, MapPin, Clock, Phone, MessageCircle, ShieldCheck,
  Store, Navigation, Package, ChevronLeft, BadgeCheck,
} from "lucide-react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProductCard } from "@/components/ProductCard"
import { getVendor } from "@/lib/vendors"
import { products, formatNaira, type Product } from "@/lib/products"
import { useCart } from "@/components/CartContext"
import { toast } from "sonner"

export default function VendorPage() {
  const params = useParams()
  const slug = typeof params?.slug === "string" ? params.slug : ""
  const vendor = getVendor(slug)
  const router = useRouter()

  const { add, open } = useCart()

  if (!vendor) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <h1 className="font-display text-4xl">Vendor not found</h1>
        <Link href="/vendors" className="mt-4 text-brand hover:underline">← Back to vendors</Link>
      </div>
    )
  }

  const items = products.filter((p) => vendor.productSlugs.includes(p.slug))

  const orderInStore = (item: (typeof items)[number]) => {
    const seller = item.sellers[0]
    add({
      id: `${item.id}-${seller.id}`,
      productId: item.id, productSlug: item.slug, productName: item.name, productImage: item.image,
      sellerId: vendor.id, sellerName: vendor.name, price: seller.price,
    })
    toast.success(`Added · rider ETA ${vendor.deliveryMins} min`)
    open()
  }

  const orderAll = () => {
    if (!items.length) return
    const item = items[0]
    const seller = item.sellers[0]
    add({
      id: `${item.id}-${vendor.id}`,
      productId: item.id, productSlug: item.slug, productName: item.name, productImage: item.image,
      sellerId: vendor.id, sellerName: vendor.name, price: seller.price,
    })
    router.push("/checkout")
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="mx-auto max-w-7xl px-4 pt-6 md:px-8">
        <Link href="/vendors" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand">
          <ChevronLeft className="h-4 w-4" /> All vendors
        </Link>
      </div>

      {/* Vendor hero */}
      <section className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border">
          <img src={vendor.banner} alt={vendor.name} className="h-56 w-full object-cover md:h-72" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
            <div className="flex flex-wrap items-center gap-2">
              {vendor.tier === "Anchor" && (
                <span className="rounded-full bg-gradient-brand px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-soft">★ Anchor tenant</span>
              )}
              {vendor.tier === "Premium" && (
                <span className="rounded-full bg-card/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-deep">Premium</span>
              )}
              {vendor.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold">
                  <BadgeCheck className="h-3 w-3" /> Verified
                </span>
              )}
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${vendor.openNow ? "bg-emerald-500" : "bg-muted/80 text-foreground"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${vendor.openNow ? "bg-white" : "bg-foreground"}`} /> {vendor.openNow ? "Open now" : "Closed"}
              </span>
            </div>
            <h1 className="mt-3 font-display text-3xl font-extrabold drop-shadow md:text-5xl">{vendor.name}</h1>
            <p className="mt-1 max-w-2xl text-sm opacity-95 md:text-base">{vendor.tagline}</p>
          </div>
        </div>
      </section>

      {/* Meta strip */}
      <section className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 md:grid-cols-4 md:p-5">
          <Meta icon={Star} label="Rating" value={`${vendor.rating} · ${vendor.reviews} reviews`} />
          <Meta icon={MapPin} label="In-store" value={`${vendor.floor} floor · Stall ${vendor.stall}`} />
          <Meta icon={Clock} label="Hours" value={vendor.hours} />
          <Meta
            icon={Bike}
            label="Rider delivery"
            value={vendor.deliveryMins ? `${vendor.deliveryMins} min · ${formatNaira(vendor.riderFee)}` : "Visit / pickup"}
          />
        </div>
      </section>

      {/* CTAs */}
      <section className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={orderAll}
            disabled={!items.length}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            <Bike className="h-4 w-4" /> Order from this shop
          </button>
          <Link
            href="/mall-map"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:border-brand hover:text-brand"
          >
            <Navigation className="h-4 w-4" /> Visit in-store
          </Link>
          <a
            href={`tel:+2348001234${vendor.id.length}${vendor.id.length}`}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:border-brand hover:text-brand"
          >
            <Phone className="h-4 w-4" /> Call shop
          </a>
          <a
            href={`https://wa.me/2348001234567?text=${encodeURIComponent(`Hi ${vendor.name}, I'd like to order from your Banex Mall shop.`)}`}
            target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:border-brand hover:text-brand"
          >
            <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
          </a>
        </div>
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-brand" /> Order is held in Banex Escrow until rider delivery is confirmed.
        </p>
      </section>

      {/* Menu / catalog */}
      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-deep">Shop catalogue</p>
            <h2 className="mt-2 font-display text-2xl font-bold md:text-3xl">In stock today</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Package className="h-3.5 w-3.5 text-brand" /> {items.length} items
          </span>
        </div>

        {items.length ? (
          <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {items.map((p: Product, i: number) => (
              <div key={p.id} className="relative">
                <ProductCard product={p} index={i} />
                <button
                  onClick={() => orderInStore(p)}
                  className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-gradient-brand px-3 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-soft"
                >
                  <Bike className="h-3 w-3" /> Quick order
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            This vendor hasn't listed items online yet — visit them at <strong>{vendor.floor} floor · {vendor.stall}</strong>.
          </p>
        )}
      </section>

      {/* About */}
      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
        <div className="grid gap-6 rounded-2xl border border-border bg-card p-6 md:grid-cols-3 md:p-8">
          <div className="md:col-span-2">
            <p className="inline-flex items-center gap-2 font-display text-base font-semibold">
              <Store className="h-4 w-4 text-brand" /> About {vendor.name}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {vendor.name} is a {vendor.tier.toLowerCase()} tenant of Banex Mall, located on the {vendor.floor.toLowerCase()} floor.
              The shop has been serving customers with {vendor.tagline.toLowerCase()} and now ships across the city through Banex riders,
              with same-hour delivery on most orders within Abuja.
            </p>
          </div>
          <div className="rounded-xl bg-surface/60 p-5 text-sm">
            <p className="font-display font-semibold">Pickup at the mall</p>
            <p className="mt-2 text-muted-foreground">
              Choose <strong>In-mall pickup</strong> at checkout and collect your order at concierge — usually ready in 15 minutes.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function Meta({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-soft/30">
        <Icon className="h-4 w-4 text-brand-deep" />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}
