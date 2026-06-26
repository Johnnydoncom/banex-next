"use client"

import { LayoutDashboard, Package, Heart, MapPin, UserCircle, Store, Settings } from "lucide-react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { useAuth } from "@/hooks/use-auth"

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const name =
    ((user as any)?.name as string | undefined) ||
    ((user as any)?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Shopper"

  // Check if the user has a vendor role or has a specific property indicating vendor status
  const isVendor = (user as any)?.role === "vendor" || (user as any)?.type === "vendor" || (user as any)?.type === "admin"

  const navItems = [
    { to: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
    { to: "/account/orders", label: "Orders", icon: Package },
    { to: "/account/wishlist", label: "Wishlist", icon: Heart },
    { to: "/account/addresses", label: "Addresses", icon: MapPin },
    { to: "/account/profile", label: "Profile", icon: UserCircle },
  ]

  if (!isVendor) {
    navItems.push({ to: "/account/become-vendor", label: "Become a Vendor", icon: Store })
  }
  
  // Add Settings to the end
  navItems.push({ to: "/account/settings", label: "Settings", icon: Settings })

  return (
    <DashboardLayout
      title="My Account"
      subtitle={`Hi, ${name}`}
      accent="brand"
      nav={navItems as any}
    >
      {children}
    </DashboardLayout>
  )
}
