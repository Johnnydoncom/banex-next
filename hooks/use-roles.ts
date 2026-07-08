"use client"

import { useSellerApplication } from "@/hooks/use-swr-data"
import { useAuth } from "./use-auth"

export type AppRole = "admin" | "vendor" | "customer"

export function useRoles() {
  const { user, session, loading: authLoading } = useAuth()
  const token = (session as any)?.accessToken as string | undefined
  const userType = (user as any)?.role || (user as any)?.type

  // We only need to verify via API when the session type isn't explicit.
  // When it IS explicit, we skip the API call by not passing a token.
  const needsVerification = !authLoading && !!user && userType !== "admin" && userType !== "vendor"
  const { profile, loading: profileLoading } = useSellerApplication(needsVerification ? token : undefined)

  if (authLoading) {
    return { roles: [] as AppRole[], isVendor: false, isAdmin: false, isCustomer: false, loading: true }
  }

  if (!user) {
    return { roles: [] as AppRole[], isVendor: false, isAdmin: false, isCustomer: false, loading: false }
  }

  let roles: AppRole[] = []

  if (userType === "admin") {
    roles = ["admin", "vendor", "customer"]
  } else if (userType === "vendor") {
    roles = ["vendor", "customer"]
  } else if (needsVerification) {
    if (profileLoading) {
      return { roles: [] as AppRole[], isVendor: false, isAdmin: false, isCustomer: false, loading: true }
    }
    if (profile && (profile as any).status === "approved") {
      roles = ["vendor", "customer"]
    } else {
      roles = ["customer"]
    }
  } else {
    roles = ["customer"]
  }

  const isVendor = roles.includes("vendor")
  const isAdmin = roles.includes("admin")
  const isCustomer = roles.includes("customer") || (!isVendor && !isAdmin)

  return { roles, isVendor, isAdmin, isCustomer, loading: false }
}

export async function requestVendorRole(userId: string) {
  return new Promise<{ error: Error | null }>((resolve) => {
    setTimeout(() => {
      resolve({ error: null })
    }, 1000)
  })
}
