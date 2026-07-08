"use client"

import { useEffect, useState } from "react"
import { useAuth } from "./use-auth"
import { sellerFetchApplication } from "@/lib/seller-api"

export type AppRole = "admin" | "vendor" | "customer"

export function useRoles() {
  const { user, session, loading: authLoading } = useAuth()
  const [roles, setRoles] = useState<AppRole[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setRoles([])
      setLoading(false)
      return
    }

    const token = (session as any)?.accessToken
    const userType = (user as any).role || (user as any).type

    async function checkRoles() {
      // If session explicitly says admin, trust it
      if (userType === "admin") {
        setRoles(["admin", "vendor", "customer"])
        setLoading(false)
        return
      }

      // If session explicitly says vendor, trust it
      if (userType === "vendor") {
        setRoles(["vendor", "customer"])
        setLoading(false)
        return
      }

      // Otherwise, the user might be an approved vendor but the token is stale.
      // Let's verify by fetching the application profile.
      try {
        if (token) {
          const profile = await sellerFetchApplication(token)
          if (profile && profile.status === "approved") {
            setRoles(["vendor", "customer"])
            setLoading(false)
            return
          }
        }
      } catch (err) {
        // Not a vendor or request failed
      }

      // Default to customer
      setRoles(["customer"])
      setLoading(false)
    }

    checkRoles()
  }, [user, authLoading])

  const isVendor = roles.includes("vendor")
  const isAdmin = roles.includes("admin")
  const isCustomer = roles.includes("customer") || (!isVendor && !isAdmin)

  return { roles, isVendor, isAdmin, isCustomer, loading: loading || authLoading }
}

export async function requestVendorRole(userId: string) {
  // ----- ACTUAL FETCH IMPLEMENTATION (Commented out as requested) -----
  /*
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/user/request-vendor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ user_id: userId })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || "Failed to request vendor role")
    return { error: null }
  } catch (error: any) {
    return { error }
  }
  */

  // ----- MOCK DATA IMPLEMENTATION -----
  return new Promise<{ error: Error | null }>((resolve) => {
    setTimeout(() => {
      resolve({ error: null })
    }, 1000)
  })
}
