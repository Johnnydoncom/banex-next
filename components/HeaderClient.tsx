"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Search, ShoppingBag, User, Heart, MapPin, LogIn, UserPlus,
  Package, Settings, LifeBuoy, Store, HeartOff, LogOut, UserCircle,
} from "lucide-react"
import { useCart } from "@/components/CartContext"
import { MobileNav } from "@/components/MobileNav"
import { useAuth, signOut } from "@/hooks/use-auth"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { GenericCategory } from "@/lib/generic-api"

export function HeaderClient({ categories }: { categories: GenericCategory[] }) {
  const { count, open } = useCart()
  const { user } = useAuth()
  const displayName =
    (user?.name as string | undefined) ||
    user?.email?.split("@")[0] ||
    ""

  const handleSignOut = async () => {
    await signOut()
    toast.success("Signed out")
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
      {/* Top utility bar */}
      <div className="hidden border-b border-border/60 bg-surface/60 md:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-xs text-muted-foreground md:px-8">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-brand" />
            Delivering across Nigeria
          </div>
          <div className="flex items-center gap-5">
            <Link href="/mall-map" className="hover:text-foreground">Mall map</Link>
            <Link href="/vendors" className="hover:text-foreground">Vendors</Link>
            <Link href="/help" className="hover:text-foreground">Help</Link>
            <Link href="/sell" className="hover:text-foreground">Sell on Banex</Link>
            <Link href="/track-order" className="hover:text-foreground">Track order</Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-3 px-4 md:gap-6 md:px-8">
        <MobileNav categories={categories} />
        <Link href="/" className="flex items-center" aria-label="Banex Mall home">
          <img
            src="/assets/banex-mall-logo.png"
            alt="Banex Mall"
            className="h-10 w-auto md:h-14"
            width={220}
            height={110}
          />
        </Link>

        {/* Search */}
        <form action="/shop" className="hidden flex-1 items-center md:flex" role="search">
          <div className="flex w-full items-stretch overflow-hidden rounded-full border border-border bg-card shadow-soft focus-within:border-brand">
            <input
              name="q"
              placeholder="Find phones, brands, sellers…"
              className="h-11 flex-1 bg-transparent px-5 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="flex items-center gap-2 bg-gradient-brand px-6 text-sm font-semibold text-primary-foreground"
            >
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1.5 md:gap-2">
          <Link
            href="/shop"
            aria-label="Search"
            className="rounded-full border border-border bg-card p-2.5 text-muted-foreground transition-colors hover:border-brand hover:text-brand md:hidden"
          >
            <Search className="h-4 w-4" />
          </Link>

          <Popover>
            <PopoverTrigger asChild>
              <button
                aria-label="Saved items"
                className="hidden rounded-full border border-border bg-card p-2.5 text-muted-foreground transition-colors hover:border-brand hover:text-brand sm:inline-flex"
              >
                <Heart className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-0">
              <div className="border-b border-border px-4 py-3">
                <p className="font-display text-sm font-semibold">Saved items</p>
                <p className="text-[11px] text-muted-foreground">Wishlist your favourite finds</p>
              </div>
              <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft/30">
                  <HeartOff className="h-5 w-5 text-brand-deep" />
                </div>
                <p className="text-sm font-medium">No saved items yet</p>
                <p className="text-xs text-muted-foreground">
                  Tap the heart on any product to keep it here.
                </p>
                <Link
                  href="/shop"
                  className="mt-2 rounded-full bg-gradient-brand px-4 py-2 text-xs font-semibold text-primary-foreground"
                >
                  Browse the mall
                </Link>
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Account"
                className="rounded-full border border-border bg-card p-2.5 text-muted-foreground transition-colors hover:border-brand hover:text-brand"
              >
                <User className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              {user ? (
                <>
                  <DropdownMenuLabel>
                    <p className="font-display text-sm font-semibold">Hi, {displayName}</p>
                    <p className="text-[11px] font-normal text-muted-foreground">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/" className="flex items-center gap-2"><UserCircle className="h-4 w-4 text-brand" /> My account</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/track-order" className="flex items-center gap-2"><Package className="h-4 w-4 text-brand" /> Track order</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/help" className="flex items-center gap-2"><LifeBuoy className="h-4 w-4 text-brand" /> Help center</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleSignOut} className="flex items-center gap-2">
                    <LogOut className="h-4 w-4 text-brand" /> Sign out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuLabel>
                    <p className="font-display text-sm font-semibold">Welcome to Banex</p>
                    <p className="text-[11px] font-normal text-muted-foreground">Sign in to track orders & save items</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/login" className="flex items-center gap-2"><LogIn className="h-4 w-4 text-brand" /> Sign in</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/signup" className="flex items-center gap-2"><UserPlus className="h-4 w-4 text-brand" /> Create account</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/track-order" className="flex items-center gap-2"><Package className="h-4 w-4 text-brand" /> Track order</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/sell" className="flex items-center gap-2"><Store className="h-4 w-4 text-brand" /> Sell on Banex</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/help" className="flex items-center gap-2"><LifeBuoy className="h-4 w-4 text-brand" /> Help center</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/contact" className="flex items-center gap-2"><Settings className="h-4 w-4 text-brand" /> Contact support</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            aria-label="Cart"
            onClick={open}
            className="relative rounded-full border border-border bg-card p-2.5 text-muted-foreground transition-colors hover:border-brand hover:text-brand"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-brand px-1 text-[10px] font-bold text-primary-foreground">
              {count}
            </span>
          </button>
        </div>
      </div>

      {/* Category nav */}
      <nav className="border-t border-border/60 bg-card/60">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 text-sm md:px-8">
          <Link
            href="/vendors"
            className="whitespace-nowrap rounded-full bg-brand-soft/30 px-3.5 py-1.5 font-semibold text-brand-deep transition-colors hover:bg-brand-soft/50"
          >
            🏬 Vendors
          </Link>
          <Link
            href="/shop"
            className="whitespace-nowrap rounded-full px-3.5 py-1.5 font-medium text-foreground transition-colors hover:bg-surface hover:text-brand"
          >
            All
          </Link>
          {categories.slice(0, 7).map((c) => (
            <Link
              key={c.slug}
              href={`/shop/${c.slug}`}
              className="whitespace-nowrap rounded-full px-3.5 py-1.5 text-muted-foreground transition-colors hover:bg-surface hover:text-brand"
            >
              {c.name}
            </Link>
          ))}
          <span className="ml-auto hidden whitespace-nowrap rounded-full bg-brand-soft/30 px-3 py-1 text-xs font-medium text-brand-deep md:inline-flex">
            🛵 Same-hour rider delivery
          </span>
        </div>
      </nav>
    </header>
  )
}
