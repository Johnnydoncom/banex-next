"use client"

import { use } from "react"
import Link from "next/link"
import { ArrowLeft, Mail, Calendar, ShoppingCart, Store, Check, X, Ban } from "lucide-react"
import { StatusBadge } from "@/components/StatusBadge"
import { StatCard } from "@/components/DashboardLayout"

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const mockUser = {
  id: "u1",
  name: "Adewale Okonkwo",
  email: "adewale@example.com",
  role: "vendor" as "admin" | "vendor" | "customer",
  status: "active" as "active" | "suspended" | "pending",
  storeName: "Goldline Mobile",
  phone: "+234 801 234 5678",
  joinedAt: "2025-08-12",
  ordersCount: 128,
  totalRevenue: 45000000,
  productsCount: 24,
  storeDescription: "Flagship phones, accessories & repair bar located at Ground Floor, Stall G-12.",
}

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  // In production: fetch user by ID
  const user = mockUser

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to users
      </Link>

      {/* Profile card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 font-display text-xl font-bold text-brand">
              {user.name.charAt(0)}
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">{user.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {user.email}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Joined {new Date(user.joinedAt).toLocaleDateString()}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={user.status} />
                <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">{user.role}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {user.status === "active" && user.role !== "admin" && (
              <button className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                <Ban className="h-3.5 w-3.5" /> Suspend
              </button>
            )}
            {user.status === "pending" && (
              <>
                <button className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white">
                  <Check className="h-3.5 w-3.5" /> Approve
                </button>
                <button className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats (vendor) */}
      {user.role === "vendor" && (
        <section className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Revenue" value={`₦${(user.totalRevenue / 1000000).toFixed(1)}M`} icon={ShoppingCart} accent="emerald" />
          <StatCard label="Orders" value={user.ordersCount} icon={ShoppingCart} accent="brand" />
          <StatCard label="Products" value={user.productsCount} icon={Store} accent="amber" />
        </section>
      )}

      {/* Store Info */}
      {user.role === "vendor" && user.storeName && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-base font-semibold">Store Information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Store Name</p>
              <p className="mt-1 text-sm font-semibold">{user.storeName}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Phone</p>
              <p className="mt-1 text-sm">{user.phone}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-medium text-muted-foreground">Description</p>
              <p className="mt-1 text-sm text-muted-foreground">{user.storeDescription}</p>
            </div>
          </div>
        </section>
      )}

      {/* Recent Orders placeholder */}
      <section className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <p className="font-display text-sm font-semibold">Recent Orders</p>
        </div>
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">
          Order history for this user will appear here.
        </div>
      </section>
    </div>
  )
}
