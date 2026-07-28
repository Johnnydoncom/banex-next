"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Home, Store, Heart, User, ShoppingBag } from "lucide-react"
import { useCart } from "@/components/CartContext"
import { useWishlist } from "@/components/WishlistContext"
import { useAuth } from "@/hooks/use-auth"

function Badge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-primary-foreground ring-2 ring-card">
      {count > 9 ? "9+" : count}
    </span>
  )
}

type LinkTab = {
  href: string
  label: string
  Icon: typeof Home
  active: boolean
  badge?: number
}

function NavLink({ tab }: { tab: LinkTab }) {
  const { href, label, Icon, active, badge = 0 } = tab
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className="group relative flex flex-col items-center justify-center gap-1 outline-none"
    >
      {/* active indicator bar */}
      <span
        className={`absolute -top-[9px] h-1 w-8 rounded-full bg-gradient-brand transition-all duration-300 ${active ? "opacity-100" : "opacity-0"
          }`}
      />
      <span className="relative">
        <Icon
          className={`h-[22px] w-[22px] transition-colors ${active ? "text-brand" : "text-muted-foreground group-active:text-foreground"
            }`}
          strokeWidth={active ? 2.4 : 2}
        />
        <Badge count={badge} />
      </span>
      <span
        className={`text-[10px] font-medium transition-colors ${active ? "text-brand" : "text-muted-foreground"
          }`}
      >
        {label}
      </span>
    </Link>
  )
}

export function MobileBottomNav() {
  const pathname = usePathname() || "/"
  const { count: cartCount, open: openCart } = useCart()
  const { count: wishCount } = useWishlist()
  const { user } = useAuth()

  // Auto-hide on scroll down, reveal on scroll up (more screen while browsing).
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    lastY.current = window.scrollY
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        const delta = y - lastY.current
        // Ignore tiny jitters; always show near the top of the page.
        if (Math.abs(delta) > 6) {
          setHidden(delta > 0 && y > 80)
          lastY.current = y
        }
        ticking = false
      })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const isActive = (base: string, exact = false) =>
    exact ? pathname === base : pathname === base || pathname.startsWith(`${base}/`)

  const savedActive = isActive("/account/wishlist")
  const accountActive = isActive("/account") && !savedActive

  const left: LinkTab[] = [
    { href: "/", label: "Home", Icon: Home, active: isActive("/", true) },
    { href: "/shop", label: "Shop", Icon: Store, active: isActive("/shop") },
  ]
  const right: LinkTab[] = [
    { href: "/account/wishlist", label: "Saved", Icon: Heart, active: savedActive, badge: wishCount },
    { href: user ? "/account" : "/login", label: "Account", Icon: User, active: accountActive },
  ]

  return (
    <nav
      aria-label="Primary"
      className={`fixed inset-x-0 bottom-0 z-40 md:hidden transition-transform duration-300 ease-out ${hidden ? "translate-y-[calc(100%+2rem)]" : "translate-y-0"
        }`}
    >
      <div className="border-t border-border bg-card/90 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)] backdrop-blur-lg rounded-t-2xl">
        <div className="mx-auto grid max-w-md grid-cols-5 items-center px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2.5">
          {left.map((t) => (
            <NavLink key={t.href} tab={t} />
          ))}

          {/* Elevated center: Cart (opens the cart sheet) */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={openCart}
              aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
              className="relative -mt-8 flex flex-col items-center outline-none"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-brand text-primary-foreground shadow-brand ring-4 ring-card transition-transform active:scale-95">
                <ShoppingBag className="h-6 w-6" strokeWidth={2.2} />
                <Badge count={cartCount} />
              </span>
              <span className="mt-1 text-[10px] font-semibold text-brand">Cart</span>
            </button>
          </div>

          {right.map((t) => (
            <NavLink key={t.href} tab={t} />
          ))}
        </div>
      </div>
    </nav>
  )
}
