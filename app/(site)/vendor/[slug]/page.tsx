import Link from "next/link"
import { notFound } from "next/navigation"
import {
  Star, Bike, MapPin, Clock, Phone, MessageCircle, ShieldCheck,
  Store, Navigation, Package, ChevronLeft, BadgeCheck,
} from "lucide-react"
import { ApiProductCard } from "@/components/ApiProductCard"
import { fetchGenericSeller } from "@/lib/generic-api"
import { VendorOrderAll, VendorQuickOrder } from "./components/VendorActions"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const resolvedParams = await params
    const { seller } = await fetchGenericSeller(resolvedParams.slug)
    if (seller) {
      return { title: `${seller.shop_name} | Banex Mall`, description: seller.description || `Shop from ${seller.shop_name} on Banex Mall` }
    }
  } catch (e) {}
  return { title: "Vendor | Banex Mall" }
}

export default async function VendorPage({ params }: { params: Promise<{ slug: string }> }) {
  let sellerData;
  try {
    const resolvedParams = await params
    sellerData = await fetchGenericSeller(resolvedParams.slug)
  } catch(e) {
    // If not found
  }

  if (!sellerData?.seller) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <h1 className="font-display text-4xl">Vendor not found</h1>
        <Link href="/vendors" className="mt-4 text-brand hover:underline">← Back to vendors</Link>
      </div>
    )
  }

  const vendor = sellerData.seller
  const items = sellerData.products || []
  
  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 pt-6 md:px-8">
        <Link href="/vendors" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand">
          <ChevronLeft className="h-4 w-4" /> All vendors
        </Link>
      </div>

      {/* Vendor hero */}
      <section className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border">
          <img src={vendor.cover_image_url || "/assets/placeholder.jpg"} alt={vendor.shop_name} className="h-56 w-full object-cover md:h-72" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
            <div className="flex flex-wrap items-center gap-2">
              {vendor.tier === "premium" && (
                <span className="rounded-full bg-card/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-deep">Premium</span>
              )}
              {vendor.is_kyc_verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold">
                  <BadgeCheck className="h-3 w-3" /> Verified
                </span>
              )}
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${vendor.is_open ? "bg-emerald-500" : "bg-muted/80 text-foreground"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${vendor.is_open ? "bg-white" : "bg-foreground"}`} /> {vendor.is_open ? "Open now" : "Closed"}
              </span>
            </div>
            <h1 className="mt-3 font-display text-3xl font-extrabold drop-shadow md:text-5xl">{vendor.shop_name}</h1>
            <p className="mt-1 max-w-2xl text-sm opacity-95 md:text-base">{vendor.description}</p>
          </div>
        </div>
      </section>

      {/* Meta strip */}
      <section className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 md:grid-cols-4 md:p-5">
          <Meta icon={Star} label="Rating" value={`${vendor.rating_average || "New"} · ${vendor.reviews_count || 0} reviews`} />
          <Meta icon={MapPin} label="In-store" value={vendor.location || "Banex Mall"} />
          <Meta icon={Clock} label="Hours" value="9 AM - 6 PM" />
          <Meta
            icon={Bike}
            label="Rider delivery"
            value={vendor.delivery_estimate_minutes ? `${vendor.delivery_estimate_minutes} min · ${formatNaira(vendor.delivery_fee || 0)}` : "Visit / pickup"}
          />
        </div>
      </section>

      {/* CTAs */}
      <section className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <div className="flex flex-wrap gap-3">
          <VendorOrderAll items={items} vendor={vendor} />
          <Link
            href="/mall-map"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:border-brand hover:text-brand"
          >
            <Navigation className="h-4 w-4" /> Visit in-store
          </Link>
          <a
            href={`tel:${vendor.phone || "+2348000000000"}`}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:border-brand hover:text-brand"
          >
            <Phone className="h-4 w-4" /> Call shop
          </a>
          <a
            href={`https://wa.me/${vendor.whatsapp ? vendor.whatsapp.replace(/[^\d]/g, "") : "2348000000000"}?text=${encodeURIComponent(`Hi ${vendor.shop_name}, I'd like to order from your Banex Mall shop.`)}`}
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
            {items.map((p) => (
              <div key={p.id} className="relative">
                {/* Need to adapt ProductCard to use GenericProduct! */}
                <ApiProductCard product={p as any} />
                <VendorQuickOrder item={p} vendor={vendor} />
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            This vendor hasn't listed items online yet — visit them at <strong>{vendor.location || "Banex Mall"}</strong>.
          </p>
        )}
      </section>

      {/* About */}
      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
        <div className="grid gap-6 rounded-2xl border border-border bg-card p-6 md:grid-cols-3 md:p-8">
          <div className="md:col-span-2">
            <p className="inline-flex items-center gap-2 font-display text-base font-semibold">
              <Store className="h-4 w-4 text-brand" /> About {vendor.shop_name}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {vendor.shop_name} is a {vendor.tier || "standard"} tenant of Banex Mall, located at {vendor.location || "the mall"}.
              The shop has been serving customers and now ships across the city through Banex riders,
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
