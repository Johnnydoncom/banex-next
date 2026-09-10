"use client"

import { useState } from "react"
import Link from "next/link"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Menu, ChevronRight, ChevronDown, Store, Truck, HelpCircle, Smartphone, Laptop, Sofa, Shirt, Sparkles, Dumbbell, Baby, PawPrint, Apple, Briefcase, Car, Home } from "lucide-react"
import { GenericCategory } from "@/lib/generic-api"

// Helper to map backend icon string to a Lucide component
export function getCategoryIcon(iconName: string | null) {
  switch (iconName) {
    case "car": return Car
    case "house": return Home
    case "smartphone": return Smartphone
    case "laptop": return Laptop
    case "sofa": return Sofa
    case "shirt": return Shirt
    case "sparkles": return Sparkles
    case "dumbbell": return Dumbbell
    case "baby": return Baby
    case "paw": return PawPrint
    case "apple": return Apple
    case "briefcase": return Briefcase
    default: return Store
  }
}

export function MobileNav({ categories }: { categories: GenericCategory[] }) {
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
                <Link href="/shop" className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-brand-deep">
                  <span className="flex items-center gap-3"><Store className="h-4 w-4 text-brand" /> All listings</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </SheetClose>
              {categories.map((c) => (
                <MobileCategoryItem key={c.slug} category={c} />
              ))}
            </ul>
          </div>

          <div className="px-5 pb-6">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-deep">Account &amp; support</p>
            <ul className="mt-3 space-y-1 text-sm">
              {[
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

/**
 * One category row in the mobile menu. The label links to the department; when
 * the category has children a chevron expands an indented list of subcategories
 * (and grandchildren). Links keep the department + node slug so filtering matches
 * the desktop mega-menu.
 */
function MobileCategoryItem({ category }: { category: GenericCategory }) {
  const [open, setOpen] = useState(false)
  const Icon = getCategoryIcon(category.icon)
  const children = category.children ?? []
  const hasChildren = children.length > 0
  const rootSlug = category.slug
  const hrefFor = (slug: string) => (slug === rootSlug ? `/shop/${rootSlug}` : `/shop/${rootSlug}/${slug}`)

  return (
    <div>
      <div className="flex items-center justify-between">
        <SheetClose asChild>
          <Link href={`/shop/${rootSlug}`} className="flex flex-1 items-center gap-3 px-4 py-3 text-sm">
            <Icon className="h-4 w-4 text-brand" /> {category.name}
          </Link>
        </SheetClose>
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? `Collapse ${category.name}` : `Expand ${category.name}`}
            aria-expanded={open}
            className="flex h-full items-center px-4 py-3 text-muted-foreground"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        ) : (
          <span className="px-4 py-3"><ChevronRight className="h-4 w-4 text-muted-foreground" /></span>
        )}
      </div>

      {hasChildren && open && (
        <div className="bg-surface/40 px-4 pb-3">
          {children.map((child) => {
            const grandkids = child.children ?? []
            return (
              <div key={child.id} className="pt-1">
                <SheetClose asChild>
                  <Link href={hrefFor(child.slug)} className="block py-1.5 pl-7 text-sm font-medium text-foreground">
                    {child.name}
                  </Link>
                </SheetClose>
                {grandkids.length > 0 && (
                  <div>
                    {grandkids.map((gc) => (
                      <SheetClose asChild key={gc.id}>
                        <Link href={hrefFor(gc.slug)} className="block py-1.5 pl-11 text-xs text-muted-foreground">
                          {gc.name}
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
