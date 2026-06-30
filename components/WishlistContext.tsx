"use client"

import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from "react"
import { useAuth } from "@/hooks/use-auth"
import {
  userFetchWishlist,
  userAddWishlist,
  userRemoveWishlist,
  userSyncWishlist,
  type WishlistItemData
} from "@/lib/user-api"
import { toast } from "sonner"
import type { GenericProduct } from "@/lib/generic-api"

export type WishlistItem = {
  id: string // Client-side we can just use productId, but from server it's item id
  productId: string
  productSlug: string
  productName: string
  productImage: string
  sellerId: string | null
  sellerName: string | null
  price: number
}

type WishlistContextValue = {
  items: WishlistItem[]
  isInWishlist: (productId: string) => boolean
  add: (product: GenericProduct) => Promise<void>
  remove: (productId: string) => Promise<void>
  toggle: (product: GenericProduct) => Promise<void>
  count: number
  isSyncing: boolean
}

const WishlistContext = createContext<WishlistContextValue | null>(null)
const STORAGE_KEY = "banex.wishlist"

// The GET /user/wishlist API only returns {id, product_id} without full product details.
// So when authenticated, we maintain client state with full product data;
// server IDs are tracked for DELETE operations.
// On sync (login with local items), we post product_ids[] and get back the server item IDs.

function extractServerIds(serverItems: WishlistItemData[]): Map<string, string> {
  // Returns a map of productId -> serverWishlistItemId
  const map = new Map<string, string>()
  serverItems.forEach(item => {
    if (item.product_id && item.id) {
      map.set(item.product_id, item.id)
    }
  })
  return map
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isSyncing, setIsSyncing] = useState(true)
  const { user, status } = useAuth()

  // 1. Initial Load: Load from localStorage first (for fast UI)
  useEffect(() => {
    if (status === "loading") return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw && status === "unauthenticated") {
        setItems(JSON.parse(raw))
      }
    } catch {}
  }, [status])

  // 2. Sync to Backend when User Logs In
  useEffect(() => {
    let mounted = true
    async function syncAndLoad() {
      if (status !== "authenticated") {
        setIsSyncing(false)
        return
      }
      setIsSyncing(true)
      try {
        const localRaw = window.localStorage.getItem(STORAGE_KEY)
        let localItems: WishlistItem[] = []
        try {
          localItems = localRaw ? JSON.parse(localRaw) : []
        } catch {}

        if (localItems.length > 0) {
          // Sync local items to server; get back server IDs for each product
          const productIds = localItems.map(item => item.productId)
          const serverItems = await userSyncWishlist(productIds)
          const serverIdMap = extractServerIds(serverItems)
          if (mounted) {
            // Enrich local items with real server wishlist item IDs
            const enriched = localItems.map(item => ({
              ...item,
              id: serverIdMap.get(item.productId) ?? item.id
            }))
            setItems(enriched)
            window.localStorage.removeItem(STORAGE_KEY)
          }
        } else {
          // No local items; fetch server wishlist (only id+product_id available)
          // We can't reconstruct full product details from server alone,
          // so just clear items - they'll be added freshly going forward.
          const serverItems = await userFetchWishlist()
          if (mounted) {
            // Only keep the server IDs as empty placeholders to avoid re-adding duplicates
            // Product details will be populated when user toggles from UI
            const minimalItems: WishlistItem[] = serverItems.map(item => ({
              id: item.id,
              productId: item.product_id,
              productSlug: "",
              productName: "Saved item",
              productImage: "",
              sellerId: null,
              sellerName: null,
              price: 0
            }))
            setItems(minimalItems)
          }
        }
      } catch (err) {
        console.error("Wishlist sync failed", err)
      } finally {
        if (mounted) setIsSyncing(false)
      }
    }
    syncAndLoad()
    return () => { mounted = false }
  }, [status])

  // 3. Keep localStorage updated ONLY for guests
  useEffect(() => {
    if (status === "unauthenticated" && !isSyncing) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, status, isSyncing])

  const add = useCallback(async (product: GenericProduct) => {
    if (items.some(i => i.productId === product.id)) return // already exists

    // Optimistically update with a temp id
    const newItem: WishlistItem = {
      id: `temp-${product.id}`, // temp until server responds
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      productImage: product.images?.find(img => img.is_primary)?.url || product.images?.[0]?.url || "",
      sellerId: product.seller?.id || null,
      sellerName: product.seller?.shop_name || null,
      price: product.price
    }

    setItems(prev => [...prev, newItem])
    toast.success("Added to wishlist")

    if (status === "authenticated") {
      try {
        const serverItem = await userAddWishlist(product.id)
        if (serverItem) {
          // Replace temp id with real server wishlist item ID
          setItems(prev => prev.map(i => i.productId === product.id ? { ...i, id: serverItem.id } : i))
        }
      } catch (e: any) {
        // Revert on error
        setItems(prev => prev.filter(i => i.productId !== product.id))
        toast.error(e.message || "Failed to add to wishlist")
      }
    }
  }, [items, status])

  const remove = useCallback(async (productId: string) => {
    const itemToRemove = items.find(i => i.productId === productId)
    if (!itemToRemove) return

    // Optimistically remove
    setItems(prev => prev.filter(i => i.productId !== productId))
    toast.success("Removed from wishlist")

    if (status === "authenticated") {
      try {
        // Use server wishlist item id (not product id) for DELETE
        const serverItemId = itemToRemove.id
        if (serverItemId && !serverItemId.startsWith("temp-")) {
          await userRemoveWishlist(serverItemId)
        }
      } catch (e: any) {
        // Revert on error
        setItems(prev => [...prev, itemToRemove])
        toast.error("Failed to remove item")
      }
    }
  }, [items, status])

  const toggle = useCallback(async (product: GenericProduct) => {
    if (items.some(i => i.productId === product.id)) {
      await remove(product.id)
    } else {
      await add(product)
    }
  }, [items, add, remove])

  const isInWishlist = useCallback((productId: string) => {
    return items.some(i => i.productId === productId)
  }, [items])

  const value = useMemo<WishlistContextValue>(() => {
    return {
      items,
      isInWishlist,
      add,
      remove,
      toggle,
      count: items.length,
      isSyncing,
    }
  }, [items, isInWishlist, add, remove, toggle, isSyncing])

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider")
  return ctx
}
