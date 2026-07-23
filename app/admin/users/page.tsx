"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { Store, Users, Shield, ArrowRight, AlertCircle } from "lucide-react"
import { AdminStatCard } from "@/components/AdminShell"
import { useAdminSellers } from "@/hooks/use-swr-data"

/**
 * User management hub — landing page for /admin/users.
 *
 * The admin overview and other surfaces link to /admin/users generically;
 * this page routes admins to the three managed segments (sellers, customers,
 * administrators) and surfaces pending vendor approvals at a glance.
 */
export default function AdminUsersHub() {
  const { data: session } = useSession()
  const token = session?.accessToken as string | undefined

  const { sellers, loading } = useAdminSellers(token)

  const approvedSellers = sellers.filter((s) => s.status === "approved").length
  const pendingSellers = sellers.filter((s) => s.status === "pending").length

  const segments = [
    {
      to: "/admin/users/sellers",
      label: "Sellers & Vendors",
      description: "Review applications, approve, suspend and manage shops.",
      icon: Store,
      accent: "emerald" as const,
      badge: pendingSellers > 0 ? `${pendingSellers} pending` : undefined,
    },
    {
      to: "/admin/users/customers",
      label: "Customers",
      description: "Browse buyer accounts, verification and suspensions.",
      icon: Users,
      accent: "brand" as const,
    },
    {
      to: "/admin/users/admins",
      label: "Administrators",
      description: "Manage staff members with console access.",
      icon: Shield,
      accent: "rose" as const,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold">User Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage vendors, customers and administrators across the marketplace.
        </p>
      </div>

      {/* Pending approvals highlight */}
      {pendingSellers > 0 && (
        <Link
          href="/admin/users/sellers"
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 transition-colors hover:bg-amber-500/15"
        >
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-amber-500/20 p-2.5">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </span>
            <div>
              <p className="font-display text-sm font-semibold">
                {pendingSellers} vendor application{pendingSellers === 1 ? "" : "s"} waiting for review
              </p>
              <p className="text-[11px] text-muted-foreground">Approve or reject pending sellers</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-amber-600" />
        </Link>
      )}

      {/* Stat cards */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard
          label="Total Vendors"
          value={loading ? "—" : sellers.length.toLocaleString()}
          icon={Store}
          accent="emerald"
          hint={`${approvedSellers} approved`}
        />
        <AdminStatCard
          label="Pending Vendors"
          value={loading ? "—" : pendingSellers}
          icon={AlertCircle}
          accent="amber"
          hint="Needs approval"
        />
        <AdminStatCard
          label="Approved Vendors"
          value={loading ? "—" : approvedSellers}
          icon={Shield}
          accent="brand"
          hint="Active on marketplace"
        />
      </section>

      {/* Segment navigation cards */}
      <section className="grid gap-3 sm:grid-cols-3">
        {segments.map((seg) => (
          <Link
            key={seg.to}
            href={seg.to}
            className="group flex flex-col justify-between gap-6 rounded-2xl border border-border bg-card p-5 transition-all hover:border-brand/40 hover:shadow-soft"
          >
            <div className="flex items-start justify-between">
              <span className="rounded-xl bg-surface p-2.5">
                <seg.icon className="h-5 w-5 text-brand" />
              </span>
              {seg.badge && (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                  {seg.badge}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-semibold">{seg.label}</p>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{seg.description}</p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  )
}
