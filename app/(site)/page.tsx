import Link from "next/link"
import {
  ArrowRight,
  ShieldCheck,
  Bike,
  Store,
  Search,
  MapPin,
  Clock,
  Smartphone,
  Car,
  Home as HomeIcon,
  Sofa,
  Shirt,
  Laptop,
  Sparkles,
  Dumbbell,
  Baby,
  PawPrint,
  Apple,
  Briefcase,
  type LucideIcon,
} from "lucide-react"
import { MallVendorCard } from "@/components/MallVendorCard"
import { ApiProductCard } from "@/components/ApiProductCard"
import { fetchGenericHome, GenericCategory, GenericSeller } from "@/lib/generic-api"
import { buildMetadata } from "@/lib/seo/metadata"
import { JsonLd } from "@/lib/seo/JsonLdComponent"
import { itemListSchema } from "@/lib/seo/jsonld"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// ─── SEO ─────────────────────────────────────────────────────────────────────

export const metadata = buildMetadata({
  title: "Banex Mall — Shop, Delivered in an Hour",
  titleAbsolute: true,
  description:
    "Order from 100+ vendors inside Banex Mall — phones, fashion, groceries, beauty, electronics — delivered same-hour by our riders across the city, or ready for in-mall pickup.",
  path: "/",
})

// ISR: Regenerate the page every 60 seconds in the background.
// The first build generates an empty page (if API is down), 
// subsequent requests get a fresh cached version.
export const revalidate = 60

// ─── Icon map (API icon slug → Lucide component) ──────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  car: Car,
  house: HomeIcon,
  smartphone: Smartphone,
  laptop: Laptop,
  sofa: Sofa,
  shirt: Shirt,
  sparkles: Sparkles,
  dumbbell: Dumbbell,
  baby: Baby,
  paw: PawPrint,
  apple: Apple,
  briefcase: Briefcase,
}

// Fallback local images keyed by category slug
const CATEGORY_IMAGES: Record<string, string> = {
  vehicles: "/assets/cat-car.jpg",
  property: "/assets/cat-apartment.jpg",
  "phones-tablets": "/assets/phone-1.jpg",
  electronics: "/assets/cat-laptop.jpg",
  "home-garden": "/assets/cat-sofa.jpg",
  fashion: "/assets/cat-sneakers.jpg",
  "health-beauty": "/assets/cat-perfume.jpg",
  "sports-outdoors": "/assets/cat-bike.jpg",
  "babies-kids": "/assets/cat-stroller.jpg",
  pets: "/assets/cat-puppy.jpg",
  "food-agriculture": "/assets/cat-veg.jpg",
  "services-jobs": "/assets/cat-watch.jpg",
}

// ─── Category card (pure server UI) ──────────────────────────────────────────

function CategoryCard({ cat }: { cat: GenericCategory }) {
  const Icon = cat.icon ? (ICON_MAP[cat.icon] ?? Store) : Store
  const image = cat.image_url ?? CATEGORY_IMAGES[cat.slug]

  return (
    <Link
      href={`/shop/${cat.slug}`}
      className="group flex flex-col items-center rounded-2xl border border-border bg-card p-4 text-center transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-soft"
    >
      <div className="relative h-20 w-20 overflow-hidden rounded-full border border-border bg-surface">
        {image ? (
          <img
            src={image}
            alt={cat.name}
            width={160}
            height={160}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-brand-soft/20">
            <Icon className="h-8 w-8 text-brand" />
          </div>
        )}
      </div>
      <p className="mt-3 flex items-center gap-1.5 font-display text-sm font-semibold text-foreground">
        <Icon className="h-3.5 w-3.5 text-brand" /> {cat.name}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {cat.listings_count} listing{cat.listings_count !== 1 ? "s" : ""}
      </p>
    </Link>
  )
}

// ─── Page (Server Component) ──────────────────────────────────────────────────

export default async function Home() {
  let data;
  try {
    data = await fetchGenericHome()
  } catch (e) {
    console.error("[homepage] Failed to fetch /generic/home:", e)
  }

  const categories = data?.categories ?? []
  const mallVendors = data?.mall_vendors ?? []
  const featuredListings = data?.featured_listings ?? []
  const popularListings = data?.popular_listings ?? []
  const openVendors = mallVendors.filter((v: GenericSeller) => v.is_open).length

  const homeJsonLd = [
    ...(categories.length
      ? [
        itemListSchema(
          "Shop by category",
          categories.map((c: GenericCategory) => ({ name: c.name, path: `/shop/${c.slug}` })),
        ),
      ]
      : []),
    ...(featuredListings.length
      ? [
        itemListSchema(
          "Featured listings",
          featuredListings.slice(0, 12).map((p) => ({
            name: p.name,
            path: `/product/${p.slug}`,
            image: p.images?.find((i) => i.is_primary)?.url || p.images?.[0]?.url,
          })),
        ),
      ]
      : []),
  ]

  return (
    <div>
      {homeJsonLd.length > 0 && <JsonLd schema={homeJsonLd} />}
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "var(--gradient-radial-brand)" }}
        />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-12 pt-10 md:grid-cols-[1.1fr_1fr] md:gap-10 md:px-8 md:pb-20 md:pt-16">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand/30 bg-brand-soft/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-brand-deep">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Order anything from Banex Mall
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] text-foreground md:text-6xl">
              Your mall, <br />
              <span className="text-gradient-brand">delivered in an hour.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              Shop from {mallVendors.length > 0 ? `${mallVendors.length}+` : "100+"} vendors inside Banex Mall —
              phones, fashion, groceries, beauty, electronics — and our riders bring it to your door,
              same-hour, across the city.
            </p>

            <form action="/shop" className="mt-7 max-w-xl">
              <div className="flex items-stretch overflow-hidden rounded-full border border-border bg-card shadow-soft focus-within:border-brand">
                <div className="flex items-center pl-5 text-muted-foreground">
                  <Search className="h-5 w-5" />
                </div>
                <Input
                  name="q"
                  placeholder="Search shops, products, brands…"
                  className="h-14 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-0 focus:outline-none focus:border-none focus-visible:ring-0 focus-visible:border-none border-none shadow-none"
                />
                <Button variant="ghost"
                  type="submit"
                  className="m-1.5 inline-flex items-center gap-2 rounded-full bg-gradient-brand px-6 text-sm font-semibold text-primary-foreground h-auto"
                >
                  Search <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>Popular:</span>
                {["Jollof rice", "iPhone", "Sneakers", "Groceries"].map((t) => (
                  <Link
                    key={t}
                    href={`/shop?q=${t}`}
                    className="rounded-full border border-border bg-card px-3 py-1 hover:border-brand hover:text-brand"
                  >
                    {t}
                  </Link>
                ))}
              </div>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Bike className="h-3.5 w-3.5 text-brand" /> Same-hour rider delivery
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5 text-brand" /> {mallVendors.length || "100"}+ mall tenants
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-brand" />
                <Link href="/mall-map" className="hover:text-brand">
                  In-mall pickup available
                </Link>
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-brand opacity-25 blur-3xl" />
            <div className="relative h-full overflow-hidden rounded-3xl border border-border bg-card shadow-brand">
              <img
                src="/assets/hero-mall.jpg"
                alt="Banex Mall featured listing"
                width={1600}
                height={1280}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-2xl bg-card/95 px-4 py-3 backdrop-blur">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-deep">
                    Live from the mall
                  </p>
                  <p className="font-display text-lg font-bold text-foreground">
                    {openVendors} shops open now
                  </p>
                </div>
                <Link
                  href="/mall-map"
                  className="inline-flex items-center gap-1 rounded-full bg-gradient-brand px-3 py-1.5 text-[11px] font-semibold text-primary-foreground"
                >
                  Mall map <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-6 md:grid-cols-4 md:px-8">
          {[
            { icon: ShieldCheck, t: "Escrow protected", s: "Held until delivery" },
            { icon: Bike, t: "Same-hour delivery", s: "Banex riders citywide" },
            { icon: Store, t: "Real mall tenants", s: "Visit shops in person" },
            { icon: Clock, t: "In-mall pickup", s: "Ready in 15 min" },
          ].map(({ icon: Icon, t, s }) => (
            <div key={t} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft/30">
                <Icon className="h-4 w-4 text-brand-deep" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t}</p>
                <p className="text-xs text-muted-foreground">{s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories grid */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 md:px-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-deep">Browse</p>
              <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">All categories</h2>
            </div>
            <Link href="/shop" className="hidden text-sm font-medium text-brand hover:underline md:inline-flex">
              View all listings →
            </Link>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} cat={cat} />
            ))}
          </div>
        </section>
      )}

      {/* Mall Vendors rail */}
      {mallVendors.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-deep">
                Tenant prominence
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Mall vendors</h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Anchor and premium tenants of Banex Mall — order in for same-hour rider delivery, or
                visit them in-store.
              </p>
            </div>
            <Link href="/vendors" className="hidden text-sm font-medium text-brand hover:underline md:inline-flex">
              All vendors <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {mallVendors.slice(0, 8).map((v) => (
              <MallVendorCard key={v.id} vendor={v} />
            ))}
          </div>
        </section>
      )}

      {/* Featured listings */}
      {featuredListings.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-14 md:px-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-deep">
                Editor&apos;s picks
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Featured listings</h2>
            </div>
            <Link href="/shop" className="text-sm font-medium text-brand hover:underline">
              See all →
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {featuredListings.slice(0, 8).map((p) => (
              <ApiProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Popular / trending listings */}
      {popularListings.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-14 md:px-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-deep">Now trending</p>
              <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Popular near you</h2>
            </div>
            <Link href="/shop" className="text-sm font-medium text-brand hover:underline">
              Browse all →
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {popularListings.slice(0, 8).map((p) => (
              <ApiProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Seller CTA */}
      <section id="sellers" className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-brand p-10 text-primary-foreground md:p-16">
          <div
            className="absolute inset-0 opacity-20"
            style={{ background: "radial-gradient(circle at 80% 20%, white, transparent 50%)" }}
          />
          <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest opacity-80">For sellers</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight md:text-5xl">
                Reach thousands of buyers across Nigeria.
              </h2>
              <p className="mt-4 max-w-md text-sm opacity-90">
                List anything from a phone to a property — set your price, get verified, and get paid
                securely. Zero setup fees.
              </p>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <Link
                href="/become-seller"
                className="inline-flex items-center gap-2 rounded-full bg-card px-6 py-3 text-sm font-semibold text-brand-deep shadow-soft hover:scale-[1.02]"
              >
                Start selling <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-xs opacity-80">Approved within 48 hours</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
