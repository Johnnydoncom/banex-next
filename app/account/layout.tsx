"use client"

import { LayoutDashboard, Package, Heart, MapPin, UserCircle } from "lucide-react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { useAuth } from "@/hooks/use-auth"

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const name =
    ((user as any)?.name as string | undefined) ||
    ((user as any)?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Shopper"

  return (
    <DashboardLayout
      title="My Account"
      subtitle={`Hi, ${name}`}
      accent="brand"
      nav={[
        { to: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
        { to: "/account/orders", label: "Orders", icon: Package },
        { to: "/account/wishlist", label: "Wishlist", icon: Heart },
        { to: "/account/addresses", label: "Addresses", icon: MapPin },
        { to: "/account/profile", label: "Profile", icon: UserCircle },
      ]}
    >
      {children}
    </DashboardLayout>
  )
}
