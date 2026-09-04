"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import type { GenericProduct } from "@/lib/generic-api"
import { ApiProductCard } from "@/components/ApiProductCard"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api-marketplace.banexmall.com/api"

/**
 * "Recently viewed" rail for the product page.
 *
 * The list is viewer-scoped (session cookie / logged-in token), so it MUST be
 * fetched from the browser — a server render has no viewer identity. Re-fetching
 * the product-by-slug from the client (with credentials) both records this view
 * for the viewer and returns their `recently_viewed` list. Renders nothing until
 * there's something to show, so it never leaves an empty heading on the page.
 */
export function RecentlyViewedProducts({ slug, currentId }: { slug: string; currentId: string }) {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken as string | undefined
  const [items, setItems] = useState<GenericProduct[]>([])

  useEffect(() => {
    const ctrl = new AbortController()
    async function load() {
      try {
        const res = await fetch(`${API_URL}/generic/products/slug/${slug}`, {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          signal: ctrl.signal,
        })
        if (!res.ok) return
        const json = await res.json().catch(() => null)
        const rv: GenericProduct[] = json?.data?.recently_viewed ?? []
        // Defensive: drop the current product and de-duplicate by id.
        const seen = new Set<string>([currentId])
        const cleaned = rv.filter((p) => p && !seen.has(p.id) && seen.add(p.id))
        setItems(cleaned.slice(0, 6))
      } catch {
        // network/abort — leave the rail hidden
      }
    }
    load()
    return () => ctrl.abort()
  }, [slug, currentId, token])

  if (items.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8">
      <h2 className="mb-6 font-display text-xl font-bold md:text-2xl">Recently viewed</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-6">
        {items.map((p) => (
          <ApiProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
