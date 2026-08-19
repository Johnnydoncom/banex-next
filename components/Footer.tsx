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
              Nigeria&apos;s friendly marketplace — shop authentic products from Banex Mall with escrow
              protection and same-hour delivery.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-brand-deep">The mall</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/shop" className="hover:text-brand">Shop online</Link></li>
              <li><Link href="/vendors" className="hover:text-brand">Mall vendors</Link></li>
              <li><Link href="/help" className="hover:text-brand">Help center</Link></li>
              <li><Link href="/contact" className="hover:text-brand">Contact us</Link></li>
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
              <li><Link href="/privacy" className="hover:text-brand">Privacy policy</Link></li>
              <li><Link href="/terms" className="hover:text-brand">Terms of service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 h-px w-full bg-border" />
        <div className="mt-6 flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {siteName}. Made with care in Nigeria.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-brand">Privacy</Link>
            <Link href="/terms" className="hover:text-brand">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
