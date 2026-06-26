"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRoles } from "./use-roles"

/**
 * Redirects non-admin users away from admin pages.
 * Returns { authorized, loading } so pages can show a loading spinner until resolved.
 */
export function useAdminGuard(redirectTo = "/account") {
  const { isAdmin, loading } = useRoles()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace(redirectTo)
    }
  }, [loading, isAdmin, router, redirectTo])

  return { authorized: isAdmin, loading }
}
