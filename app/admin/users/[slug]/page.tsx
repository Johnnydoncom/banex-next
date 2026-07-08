"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Mail, Calendar, Check, X, Ban, Loader2 } from "lucide-react"
import { StatusBadge } from "@/components/StatusBadge"
import { fetchAdminUser, toggleUserVerification, toggleUserSuspension, type AdminUser } from "@/lib/admin-api"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

export default function AdminUserDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { session } = useAuth()
  
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      const token = (session as any)?.accessToken
      if (!token) return

      try {
        setLoading(true)
        const res = await fetchAdminUser(slug, token)
        setUser(res.data.user)
      } catch (err: any) {
        toast.error(err.message || "Failed to load user details")
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [slug, session])

  const handleToggleVerification = async () => {
    const token = (session as any)?.accessToken
    if (!token || !user) return
    try {
      const res = await toggleUserVerification(user.id, token)
      setUser(res.data?.user || { ...user, email_verified_at: user.email_verified_at ? null : new Date().toISOString() })
      toast.success("Verification status toggled")
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle verification")
    }
  }

  const handleToggleSuspension = async () => {
    const token = (session as any)?.accessToken
    if (!token || !user) return
    try {
      const res = await toggleUserSuspension(user.id, token)
      setUser(res.data?.user || { ...user, status: user.status === "suspended" ? "active" : "suspended" })
      toast.success("Suspension status toggled")
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle suspension")
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
        <p className="text-sm font-medium text-muted-foreground">Loading user details...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card">
        <p className="text-sm font-medium text-muted-foreground">User not found.</p>
        <Link href="/admin/users/customers" className="text-sm text-brand hover:underline">
          Go back
        </Link>
      </div>
    )
  }

  const name = user.full_name || "Unknown User"

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href={user.type === "admin" ? "/admin/users/admins" : "/admin/users/customers"} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to {user.type === "admin" ? "admins" : "customers"}
      </Link>

      {/* Profile card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 font-display text-xl font-bold text-brand uppercase">
              {name.charAt(0)}
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">{name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {user.email}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Joined {user.created_at ? new Date(user.created_at.item).toLocaleDateString() : "Unknown"}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={user.status} />
                <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">{user.type}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <button onClick={handleToggleVerification} className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-surface">
               {user.email_verified_at ? "Unverify Email" : "Verify Email"}
             </button>
             <button onClick={handleToggleSuspension} className={`rounded-lg px-4 py-2 text-xs font-semibold text-white ${user.status === "suspended" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}>
               {user.status === "suspended" ? "Unsuspend" : "Suspend"}
             </button>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-base font-semibold">User Information</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Full Name</p>
            <p className="mt-1 text-sm font-semibold">{name}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Phone</p>
            <p className="mt-1 text-sm">{user.phone || "N/A"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Email</p>
            <p className="mt-1 text-sm">{user.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Email Verified</p>
            <p className="mt-1 text-sm">{user.email_verified_at ? new Date(user.email_verified_at).toLocaleDateString() : "No"}</p>
          </div>
        </div>
      </section>

      {/* Seller Link Placeholder */}
      {user.type === "vendor" && user.seller && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-base font-semibold">Seller Profile</h2>
          <div className="mt-4">
             <Link href={`/admin/users/sellers/${user.seller.slug}`} className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline">
               View Seller Dashboard for {user.seller.shop_name}
             </Link>
          </div>
        </section>
      )}
    </div>
  )
}
