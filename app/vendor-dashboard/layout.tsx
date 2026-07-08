"use client"

import { LayoutDashboard, Package, Store, Settings, PackageOpen, Landmark, UserCircle } from "lucide-react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { useAuth } from "@/hooks/use-auth"
import { useRoles } from "@/hooks/use-roles"

export default function VendorDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { isVendor, loading } = useRoles()

  const name =
    ((user as any)?.name as string | undefined) ||
    ((user as any)?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Vendor"

  return (
    <DashboardLayout
      title="Merchant Center"
      subtitle={`Welcome back, ${name}`}
      accent="emerald"
      guard={() => {
        if (loading) return null
        return isVendor ? { ok: true, redirectTo: "" } : { ok: false, redirectTo: "/account/profile" }
      }}
      nav={[
        { to: "/vendor-dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
        { to: "/vendor-dashboard/orders", label: "Orders", icon: Package },
        { to: "/vendor-dashboard/products", label: "Products", icon: PackageOpen },
        { to: "/vendor-dashboard/finances", label: "Finances", icon: Landmark },
        { to: "/vendor-dashboard/store", label: "Store Profile", icon: Store },
        { to: "/vendor-dashboard/settings", label: "Settings", icon: Settings },
        { to: "/account", label: "Customer Account", icon: UserCircle },
      ]}
    >
      {children}
    </DashboardLayout>
  )
}
