"use client"

import { SessionProvider } from "next-auth/react"
import { CartProvider } from "@/components/CartContext"
import { CartSheet } from "@/components/CartSheet"
import { Toaster } from "@/components/ui/sonner"
import type { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        {children}
        <CartSheet />
        <Toaster position="top-right" richColors />
      </CartProvider>
    </SessionProvider>
  )
}
