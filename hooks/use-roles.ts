"use client"

import { useAuth } from "./use-auth"

// Banex Mall is the single seller — there is no vendor role. Users are either an
// admin (full console) or a customer. `isVendor` is retained as `false` for any
// legacy callers.
export type AppRole = "admin" | "customer"

export function useRoles() {
  const { user, loading: authLoading } = useAuth()
  const userType = (user as any)?.role || (user as any)?.type

  if (authLoading) {
    return { roles: [] as AppRole[], isVendor: false, isAdmin: false, isCustomer: false, loading: true }
  }
  if (!user) {
    return { roles: [] as AppRole[], isVendor: false, isAdmin: false, isCustomer: false, loading: false }
  }

  const isAdmin = userType === "admin"
  const roles: AppRole[] = isAdmin ? ["admin"] : ["customer"]

  return { roles, isVendor: false, isAdmin, isCustomer: !isAdmin, loading: false }
}
