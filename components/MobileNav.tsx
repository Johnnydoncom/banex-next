"use client"

import Link from "next/link"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Menu, ChevronRight, Store, Truck, HelpCircle, User, MapPin } from "lucide-react"
import { categories } from "@/lib/categories"

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger
        aria-label="Open menu"
        className="inline-flex items-center justify-center rounded-full border border-border bg-card p-2.5 text-muted-foreground hover:border-brand hover:text-brand md:hidden"
      >
        <Menu className="h-4 w-4" />
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle>
            <img src="/assets/banex-mall-logo.png" alt="Banex Mall" className="h-10 w-auto" />
          </SheetTitle>
        </SheetHeader>

        <div className="flex h-[calc(100%-72px)] flex-col overflow-y-auto">
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-deep">Browse</p>
            <ul className="mt-3 divide-y divide-border/60 rounded-xl border border-border bg-card">
              <SheetClose asChild>
                <Link href="/vendors" className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-brand-deep">
                  <span className="flex items-center gap-3"><Store className="h-4 w-4 text-brand" /> Mall vendors</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link href="/mall-map" className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-brand-deep">
                  <span className="flex items-center gap-3"><MapPin className="h-4 w-4 text-brand" /> Mall map</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link href="/shop" className="flex items-center justify-between px-4 py-3 text-sm font-medium">
                  All listings <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </SheetClose>
              {categories.map((c) => {
                const Icon = c.icon
                return (
                  <SheetClose asChild key={c.slug}>
                    <Link
                      href={`/shop?category=${c.slug}`}
                      className="flex items-center justify-between px-4 py-3 text-sm"
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-brand" /> {c.name}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </SheetClose>
                )
              })}
            </ul>
          </div>

          <div className="px-5 pb-6">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-deep">Account &amp; support</p>
            <ul className="mt-3 space-y-1 text-sm">
              {[
                { href: "/sell", icon: Store, label: "Sell on Banex" },
                { href: "/become-seller", icon: User, label: "Become a seller" },
                { href: "/top-sellers", icon: User, label: "Top sellers" },
                { href: "/track-order", icon: Truck, label: "Track order" },
                { href: "/delivery", icon: Truck, label: "Delivery" },
                { href: "/returns", icon: HelpCircle, label: "Returns" },
                { href: "/help", icon: HelpCircle, label: "Help center" },
                { href: "/contact", icon: HelpCircle, label: "Contact" },
              ].map(({ href, icon: Icon, label }) => (
                <SheetClose asChild key={href}>
                  <Link href={href} className="flex items-center gap-3 rounded-md px-2 py-2 text-muted-foreground hover:text-foreground">
                    <Icon className="h-4 w-4 text-brand" /> {label}
                  </Link>
                </SheetClose>
              ))}
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
