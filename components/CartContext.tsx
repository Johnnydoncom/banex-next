"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

export type CartItem = {
  id: string // productId-sellerId
  productId: string
  productSlug: string
  productName: string
  productImage: string
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
  add: (item: Omit<CartItem, "qty">, qty?: number) => void
  remove: (id: string) => void
  setQty: (id: string, qty: number) => void
  clear: () => void
  count: number
  subtotal: number
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = "banex.cart"

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null
      if (raw) setItems(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {}
  }, [items])

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((a, b) => a + b.qty, 0)
    const subtotal = items.reduce((a, b) => a + b.qty * b.price, 0)
    return {
      items,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      setOpen: setIsOpen,
      add: (item, qty = 1) =>
        setItems((prev) => {
          const found = prev.find((i) => i.id === item.id)
          if (found) return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + qty } : i))
          return [...prev, { ...item, qty }]
        }),
      remove: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
      setQty: (id, qty) =>
        setItems((prev) =>
          qty <= 0 ? prev.filter((i) => i.id !== id) : prev.map((i) => (i.id === id ? { ...i, qty } : i)),
        ),
      clear: () => setItems([]),
      count,
      subtotal,
    }
  }, [items, isOpen])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
