"use client"

import { useEffect, useRef } from "react"
import { LayoutDashboard, Package, Truck, Heart, MapPin, UserCircle, Settings, Store } from "lucide-react"
import { useSession } from "next-auth/react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { useAuth } from "@/hooks/use-auth"
import { useRoles } from "@/hooks/use-roles"
import { useSellerApplication } from "@/hooks/use-swr-data"

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth()
  const { isAdmin, isVendor, loading } = useRoles()
  const { update } = useSession()

  // If the seller was approved after login, the JWT is stale (isVendor=false).
  // Detect the live approved status and refresh the session ONCE so the vendor
  // shortcut appears and the /vendor-dashboard proxy grants access.
  const token = (session as any)?.accessToken as string | undefined
  const { profile } = useSellerApplication(!isAdmin && !isVendor ? token : undefined)
  const refreshedRef = useRef(false)
  useEffect(() => {
    if (!isAdmin && !isVendor && profile?.status === "approved" && !refreshedRef.current) {
      refreshedRef.current = true
      update()
    }
  }, [isAdmin, isVendor, profile, update])

  const name =
    ((user as any)?.name as string | undefined) ||
    ((user as any)?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Shopper"

  const navItems = [
    { to: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
    { to: "/account/orders", label: "Orders", icon: Package },
    { to: "/account/track", label: "Track Order", icon: Truck },
    { to: "/account/wishlist", label: "Wishlist", icon: Heart },
    { to: "/account/addresses", label: "Addresses", icon: MapPin },
    { to: "/account/profile", label: "Profile", icon: UserCircle },
    // Approved vendors get a shortcut to their merchant dashboard; other users can apply.
    isVendor
      ? { to: "/vendor-dashboard", label: "Vendor Dashboard", icon: Store }
      : { to: "/account/become-vendor", label: "Become a Vendor", icon: Store },
    { to: "/account/settings", label: "Settings", icon: Settings },
  ]

  return (
    <DashboardLayout
      title="My Account"
      subtitle={`Hi, ${name}`}
      accent="brand"
      nav={navItems as any}
      guard={() => {
        if (loading) return null
        // Admins are confined to the admin console — keep them out of the
        // customer dashboard. Customers and vendors both belong here.
        return isAdmin ? { ok: false, redirectTo: "/admin" } : { ok: true, redirectTo: "" }
      }}
    >
      {children}
    </DashboardLayout>
  )
}
