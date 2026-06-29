"use client"

import { SessionProvider, signOut } from "next-auth/react"
import { CartProvider } from "@/components/CartContext"
import { CartSheet } from "@/components/CartSheet"
import { Toaster } from "@/components/ui/sonner"
import { useEffect, type ReactNode } from "react"
import { toast } from "sonner"

function GlobalFetchInterceptor({ children }: { children: ReactNode }) {
  useEffect(() => {
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const response = await originalFetch(...args)

      let url = ""
      if (typeof args[0] === "string") {
        url = args[0]
      } else if (args[0] instanceof URL) {
        url = args[0].toString()
      } else if (args[0] instanceof Request) {
        url = args[0].url
      }

      // If the proxy returns 401 Unauthenticated, log the user out
      if (response.status === 401 && url.includes("/api/proxy")) {
        toast.error("Session expired. Please log in again.")
        signOut({ callbackUrl: "/login" })
      }

      return response
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  return <>{children}</>
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <GlobalFetchInterceptor>
        <CartProvider>
          {children}
          <CartSheet />
          <Toaster position="top-right" richColors />
        </CartProvider>
      </GlobalFetchInterceptor>
    </SessionProvider>
  )
}