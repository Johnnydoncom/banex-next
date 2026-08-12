"use client"

import { LayoutDashboard, Package, Truck, Heart, MapPin, UserCircle, Settings } from "lucide-react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { useAuth } from "@/hooks/use-auth"
import { useRoles } from "@/hooks/use-roles"

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { isAdmin, loading } = useRoles()

  const name =
    ((user as any)?.name as string | undefined) ||
    ((user as any)?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Shopper"

  // Banex Mall is the single seller — customers have no vendor tools.
  const navItems = [
    { to: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
    { to: "/account/orders", label: "Orders", icon: Package },
    { to: "/account/track", label: "Track Order", icon: Truck },
    { to: "/account/wishlist", label: "Wishlist", icon: Heart },
    { to: "/account/addresses", label: "Addresses", icon: MapPin },
    { to: "/account/profile", label: "Profile", icon: UserCircle },
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
