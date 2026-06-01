"use client"

import { useEffect, useState } from "react"
import { useAuth } from "./use-auth"
import { toast } from "sonner"

export type AppRole = "admin" | "vendor" | "customer"

export function useRoles() {
  const { user, loading: authLoading } = useAuth()
  const [roles, setRoles] = useState<AppRole[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setRoles([])
      setLoading(false)
      return
    }

    const userType = (user as any).role

    if (userType === "vendor") {
      setRoles(["vendor", "customer"])
    } else if (userType === "admin") {
      setRoles(["admin", "vendor", "customer"])
    } else {
      setRoles(["customer"])
    }

    setLoading(false)
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
