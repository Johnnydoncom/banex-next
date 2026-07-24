import Link from "next/link"
import type { ResolvedSiteSettings } from "@/lib/site-settings"

export function Footer({ settings }: { settings?: ResolvedSiteSettings }) {
  const siteName = settings?.siteName || "Banex Mall"
  const logoSrc = settings?.logoUrl || "/assets/banex-mall-logo.png"
  return (
    <footer className="mt-24 border-t border-border bg-surface/60">
      <div className="mx-auto container py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt={siteName} className="h-14 w-auto" width={220} height={110} />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Nigeria&apos;s friendly marketplace. Buy and sell anything from verified sellers across the country.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-brand-deep">The mall</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/vendors" className="hover:text-brand">All vendors</Link></li>
              <li><Link href="/mall-map" className="hover:text-brand">Mall map</Link></li>
              <li><Link href="/shop" className="hover:text-brand">Shop online</Link></li>
              <li><Link href="/top-sellers" className="hover:text-brand">Top vendors</Link></li>
              <li><Link href="/sell" className="hover:text-brand">Become a tenant</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-brand-deep">Buy</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/track-order" className="hover:text-brand">Track order</Link></li>
              <li><Link href="/delivery" className="hover:text-brand">Delivery</Link></li>
              <li><Link href="/returns" className="hover:text-brand">Returns &amp; refunds</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-brand-deep">Support</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/help" className="hover:text-brand">Help center</Link></li>
              <li><Link href="/contact" className="hover:text-brand">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 h-px w-full bg-border" />
        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {siteName}. Made with care in Nigeria.
        </p>
      </div>
    </footer>
  )
}
