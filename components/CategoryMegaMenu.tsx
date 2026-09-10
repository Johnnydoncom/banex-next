"use client"

import Link from "next/link"
import * as HoverCard from "@radix-ui/react-hover-card"
import { ChevronDown, ArrowRight } from "lucide-react"
import type { GenericCategory } from "@/lib/generic-api"

/**
 * A single top-level category entry in the header rail. When it has children it
 * reveals a hover dropdown / mega-menu (portaled out so the rail's horizontal
 * scroll never clips it); with no children it's a plain link.
 *
 * Links keep the department as the first path segment and the target node's slug
 * as the second, so `/shop/[category]/[subcategory]` filters by that node's slug
 * at any depth while preserving the department context.
 */
export function CategoryMegaMenu({ category }: { category: GenericCategory }) {
  const children = category.children ?? []
  const hasChildren = children.length > 0
  const hasGrandchildren = children.some((c) => (c.children?.length ?? 0) > 0)
  const rootSlug = category.slug
  const hrefFor = (slug: string) => (slug === rootSlug ? `/shop/${rootSlug}` : `/shop/${rootSlug}/${slug}`)

  const trigger = (
    <Link
      href={`/shop/${rootSlug}`}
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3.5 py-1.5 text-muted-foreground transition-colors hover:bg-surface hover:text-brand data-[state=open]:bg-surface data-[state=open]:text-brand"
    >
      {category.name}
      {hasChildren && <ChevronDown className="h-3.5 w-3.5 opacity-60" />}
    </Link>
  )

  if (!hasChildren) return trigger

  return (
    <HoverCard.Root openDelay={80} closeDelay={120}>
      <HoverCard.Trigger asChild>{trigger}</HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          align="start"
          sideOffset={10}
          collisionPadding={16}
          className="z-50 max-h-[75vh] overflow-y-auto rounded-2xl border border-border bg-popover p-5 text-popover-foreground shadow-xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
          style={{ width: hasGrandchildren ? "min(92vw, 56rem)" : "min(92vw, 26rem)" }}
        >
          {/* Header */}
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-border pb-3">
            <p className="font-display text-sm font-bold">{category.name}</p>
            <Link href={`/shop/${rootSlug}`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
              Shop all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {hasGrandchildren ? (
            // Mega-menu: a column per child, with grandchildren listed beneath.
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-3 lg:grid-cols-4">
              {children.map((child) => {
                const grandkids = child.children ?? []
                return (
                  <div key={child.id} className="min-w-0">
                    <Link
                      href={hrefFor(child.slug)}
                      className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-brand"
                    >
                      {child.name}
                    </Link>
                    {grandkids.length > 0 && (
                      <ul className="mt-2 space-y-1.5">
                        {grandkids.map((gc) => (
                          <li key={gc.id}>
                            <Link
                              href={hrefFor(gc.slug)}
                              className="block truncate text-xs text-muted-foreground transition-colors hover:text-brand"
                            >
                              {gc.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            // Simple dropdown: a two-column list of child categories.
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
              {children.map((child) => (
                <li key={child.id}>
                  <Link
                    href={hrefFor(child.slug)}
                    className="block truncate rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-brand"
                  >
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}
