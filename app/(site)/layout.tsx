import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

/**
 * Site layout — wraps all public-facing (site) pages.
 *
 * Header is an async server component that fetches categories once here,
 * at the layout level. This prevents individual client pages from importing
 * the async Header directly (which would cause infinite re-fetching loops).
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
