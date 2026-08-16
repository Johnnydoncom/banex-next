import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { MobileBottomNav } from "@/components/MobileBottomNav"
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp"
import { getSiteSettings } from "@/lib/site-settings"

/**
 * Site layout — wraps all public-facing (site) pages.
 *
 * Header is an async server component that fetches categories once here,
 * at the layout level. This prevents individual client pages from importing
 * the async Header directly (which would cause infinite re-fetching loops).
 *
 * Site settings (name/logo/support email) come from the public /generic/settings
 * endpoint, fetched once here and passed to the header and footer.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()

  return (
    // pb on mobile reserves room so the fixed bottom nav never hides the footer
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <Header settings={settings} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
      <FloatingWhatsApp />
      <MobileBottomNav />
    </div>
  )
}
