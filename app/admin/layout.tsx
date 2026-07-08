"use client"

import {
  LayoutDashboard,
  Users,
  Package,
  FolderTree,
  ShoppingCart,
  MessageCircle,
  Settings,
  Store,
  Shield,
  CreditCard,
  Banknote,
  TrendingUp,
  Coins,
  Award,
} from "lucide-react"
import { AdminShell } from "@/components/AdminShell"
import { useAuth } from "@/hooks/use-auth"
import { useRoles } from "@/hooks/use-roles"

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { isAdmin, loading } = useRoles()

  const name =
    ((user as any)?.name as string | undefined) ||
    ((user as any)?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Admin"

  return (
    <AdminShell
      title="Admin Console"
      subtitle={`Welcome, ${name}`}
      accent="brand"
      guard={() => {
        if (loading) return null
        return isAdmin ? { ok: true, redirectTo: "" } : { ok: false, redirectTo: "/account" }
      }}
      nav={[
        { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true, group: "Main" },
        
        { to: "/admin/products", label: "Products", icon: Package, group: "Catalog" },
        { to: "/admin/categories", label: "Categories", icon: FolderTree, group: "Catalog" },
        
        { to: "/admin/orders", label: "Orders", icon: ShoppingCart, group: "Sales" },

        { to: "/admin/revenue", label: "Revenue", icon: TrendingUp, group: "Finance" },
        { to: "/admin/payments", label: "Payments", icon: CreditCard, group: "Finance" },
        { to: "/admin/withdrawals", label: "Withdrawals", icon: Banknote, group: "Finance" },
        { to: "/admin/payouts", label: "Seller Payouts", icon: Coins, group: "Finance" },

        { to: "/admin/users/sellers", label: "Sellers & Vendors", icon: Store, group: "People" },
        { to: "/admin/users/customers", label: "Customers", icon: Users, group: "People" },
        { to: "/admin/users/admins", label: "Administrators", icon: Shield, group: "People" },
        
        { to: "/admin/seller-tiers", label: "Seller Tiers", icon: Award, group: "System" },
        { to: "/admin/contacts", label: "WhatsApp Contacts", icon: MessageCircle, group: "System" },
        { to: "/admin/settings", label: "Settings", icon: Settings, group: "System" },
      ]}
    >
      {children}
    </AdminShell>
  )
}
