"use client"

import { useAuth } from "./use-auth"

// Roles: admin (full console), vendor (owns an approved store → vendor dashboard +
// customer area), or customer. Vendor status comes from the session (a user linked
// to an approved seller has hasStore=true / storeStatus="approved").
export type AppRole = "admin" | "vendor" | "customer"

export function useRoles() {
  const { user, loading: authLoading } = useAuth()
  const userType = (user as any)?.role || (user as any)?.type
  const hasStore = (user as any)?.hasStore === true
  const storeStatus = (user as any)?.storeStatus as string | null | undefined

  if (authLoading) {
    return { roles: [] as AppRole[], isVendor: false, isAdmin: false, isCustomer: false, loading: true }
  }
  if (!user) {
    return { roles: [] as AppRole[], isVendor: false, isAdmin: false, isCustomer: false, loading: false }
  }

  const isAdmin = userType === "admin"
  const isVendor = !isAdmin && hasStore && storeStatus === "approved"

  const roles: AppRole[] = isAdmin ? ["admin"] : isVendor ? ["vendor", "customer"] : ["customer"]

  return { roles, isVendor, isAdmin, isCustomer: !isAdmin, loading: false }
}
