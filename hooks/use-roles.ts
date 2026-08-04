"use client"

import { useSellerApplication } from "@/hooks/use-swr-data"
import { useAuth } from "./use-auth"

export type AppRole = "admin" | "vendor" | "customer"

export function useRoles() {
  const { user, session, loading: authLoading } = useAuth()
  const token = (session as any)?.accessToken as string | undefined
  const userType = (user as any)?.role || (user as any)?.type
  // Vendor status now travels in the session (set at login). `hasStore` is only
  // treated as a vendor when the store is approved.
  const hasStore = (user as any)?.hasStore === true
  const storeStatus = (user as any)?.storeStatus as string | null | undefined
  const sessionKnowsStore = (user as any)?.hasStore !== undefined

  // Fallback for older sessions whose JWT predates `hasStore`: verify via the
  // seller application. Admins never need this, and neither do sessions that
  // already carry store info.
  const needsVerification = !authLoading && !!user && userType !== "admin" && !sessionKnowsStore
  const { profile, loading: profileLoading } = useSellerApplication(needsVerification ? token : undefined)

  if (authLoading) {
    return { roles: [] as AppRole[], isVendor: false, isAdmin: false, isCustomer: false, loading: true }
  }

  if (!user) {
    return { roles: [] as AppRole[], isVendor: false, isAdmin: false, isCustomer: false, loading: false }
  }

  let roles: AppRole[] = []

  if (userType === "admin") {
    // Admins are confined to the admin console — no customer/vendor access.
    roles = ["admin"]
  } else if (sessionKnowsStore) {
    roles = hasStore && storeStatus === "approved" ? ["vendor", "customer"] : ["customer"]
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
