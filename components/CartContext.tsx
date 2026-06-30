"use client"

import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from "react"
import { useAuth } from "@/hooks/use-auth"
import {
  userFetchCart,
  userAddToCart,
  userUpdateCartQty,
  userRemoveFromCart,
  userClearCart,
  userSyncCart,
  type CartItemData
} from "@/lib/user-api"
import { toast } from "sonner"

export type CartItem = {
  id: string // Client-side we can just use productId-sellerId for local, but from server it's cartItemId
  productId: string
  productSlug: string
  productName: string
  productImage: string | null // null when the product has no images
  sellerId: string
  sellerName: string
  price: number
  qty: number
}

type CartContextValue = {
  items: CartItem[]
  isOpen: boolean
  open: () => void
  close: () => void
  setOpen: (v: boolean) => void
  add: (item: Omit<CartItem, "qty">, qty?: number) => Promise<void>
  remove: (id: string) => Promise<void>
  setQty: (id: string, qty: number) => Promise<void>
  clear: () => Promise<void>
  count: number
  subtotal: number
  isSyncing: boolean
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = "banex.cart"

function mapServerCart(serverItems: CartItemData[]): CartItem[] {
  return serverItems.map(item => ({
    id: item.id,            // cart-item id (used as React key)
    productId: item.product_id,
    productSlug: "",        // not returned by cart API
    productName: item.product.name,
    // Real API uses primary_image_url (not images[])
    productImage: item.product.primary_image_url || null,
    sellerId: item.seller?.id ?? "",
    sellerName: item.seller?.shop_name ?? "Unknown Seller",
    price: Number(item.unit_price),  // real field is unit_price
    qty: item.quantity
  }))
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
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
        let localItems: CartItem[] = []
        try {
          localItems = localRaw ? JSON.parse(localRaw) : []
        } catch {}

        if (localItems.length > 0) {
          // Sync local items to server
          const syncPayload = localItems.map(item => ({ product_id: item.productId, quantity: item.qty }))
          const serverCart = await userSyncCart(syncPayload)
          if (mounted && serverCart) {
            setItems(mapServerCart(serverCart.items))
            window.localStorage.removeItem(STORAGE_KEY) // Clear local, now managed by server
          }
        } else {
          // Just fetch server cart
          const serverCart = await userFetchCart()
          if (mounted && serverCart) {
            setItems(mapServerCart(serverCart.items))
          }
        }
      } catch (err) {
        console.error("Cart sync failed", err)
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


  const add = useCallback(async (item: Omit<CartItem, "qty">, qty = 1) => {
    if (status === "authenticated") {
      // Optimistic update could go here, but for safety let's wait for API
      try {
        const serverCart = await userAddToCart(item.productId, qty)
        if (serverCart) setItems(mapServerCart(serverCart.items))
        toast.success("Added to cart")
        setIsOpen(true)
      } catch (e: any) {
        toast.error(e.message || "Failed to add to cart")
      }
    } else {
      setItems((prev) => {
        const found = prev.find((i) => i.productId === item.productId)
        if (found) return prev.map((i) => (i.productId === item.productId ? { ...i, qty: i.qty + qty } : i))
        return [...prev, { ...item, id: `${item.productId}-${item.sellerId}`, qty }]
      })
      toast.success("Added to cart")
      setIsOpen(true)
    }
  }, [status])

  const remove = useCallback(async (id: string) => {
    if (status === "authenticated") {
      // Find the item to get its productId (API requires productId, not cart-item id)
      const item = items.find(i => i.id === id)
      if (!item) return
      // Optimistic update
      setItems(prev => prev.filter(i => i.id !== id))
      try {
        const serverCart = await userRemoveFromCart(item.productId)
        if (serverCart) setItems(mapServerCart(serverCart.items))
      } catch (e: any) {
        // Revert on failure
        setItems(prev => [...prev, item])
        toast.error("Failed to remove item")
      }
    } else {
      setItems((prev) => prev.filter((i) => i.id !== id))
    }
  }, [status, items])

  const setQty = useCallback(async (id: string, qty: number) => {
    if (qty <= 0) return remove(id)
    if (status === "authenticated") {
      // Find the item to get its productId (API requires productId, not cart-item id)
      const item = items.find(i => i.id === id)
      if (!item) return
      // Optimistic update
      setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
      try {
        const serverCart = await userUpdateCartQty(item.productId, qty)
        if (serverCart) setItems(mapServerCart(serverCart.items))
      } catch (e: any) {
        // Revert on failure
        setItems(prev => prev.map(i => i.id === id ? { ...i, qty: item.qty } : i))
        toast.error("Failed to update quantity")
      }
    } else {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)))
    }
  }, [status, items, remove])

  const clear = useCallback(async () => {
    if (status === "authenticated") {
      try {
        await userClearCart()
        setItems([])
      } catch (e: any) {
        toast.error("Failed to clear cart")
      }
    } else {
      setItems([])
    }
  }, [status])

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((a, b) => a + b.qty, 0)
    const subtotal = items.reduce((a, b) => a + b.qty * b.price, 0)
    return {
      items,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      setOpen: setIsOpen,
      add,
      remove,
      setQty,
      clear,
      count,
      subtotal,
      isSyncing,
    }
  }, [items, isOpen, add, remove, setQty, clear, isSyncing])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
