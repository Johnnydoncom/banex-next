"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Mail, Calendar, Loader2, Pencil, Save } from "lucide-react"
import { StatusBadge } from "@/components/StatusBadge"
import { fetchAdminUser, toggleUserVerification, toggleUserSuspension, updateAdminUser, type AdminUser } from "@/lib/admin-api"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminUserDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { session } = useAuth()
  
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ full_name: "", phone: "" })

  useEffect(() => {
    const loadUser = async () => {
      const token = (session as any)?.accessToken
      if (!token) return

      try {
        setLoading(true)
        const res = await fetchAdminUser(slug, token)
        setUser(res.data.user)
        setForm({
          full_name: res.data.user.full_name || "",
          phone: res.data.user.phone || "",
        })
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
      setUser(res.data?.user || { ...user, email_verified_at: user.email_verified_at ? null : { item: new Date().toISOString() } })
      toast.success("Verification status toggled")
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle verification")
    }
  }

  const handleSaveEdit = async () => {
    const token = (session as any)?.accessToken
    if (!token || !user) return
    setSaving(true)
    try {
      const res = await updateAdminUser(user.id, {
        full_name: form.full_name.trim() || null,
        phone: form.phone.trim() || null,
      }, token)
      setUser(res.data?.user || { ...user, ...form })
      setEditing(false)
      toast.success("User details updated")
    } catch (err: any) {
      toast.error(err.message || "Failed to update user")
    } finally {
      setSaving(false)
    }
  }

  const handleToggleSuspension = async () => {
    const token = (session as any)?.accessToken
    if (!token || !user) return
    try {
      const currentlySuspended = user.is_suspended ?? (user.status === "suspended" || !!user.suspended_at)
      const res = await toggleUserSuspension(user.id, token)
      setUser(res.data?.user || { ...user, is_suspended: !currentlySuspended })
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
  const isSuspended = user.is_suspended ?? (user.status === "suspended" || !!user.suspended_at)

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
                <StatusBadge status={user.status ?? (isSuspended ? "suspended" : user.email_verified_at ? "active" : "pending")} />
                <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">{user.type}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <Button type="button" variant="outline" onClick={() => setEditing((v) => !v)} className="h-auto gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold">
               <Pencil className="h-3.5 w-3.5" /> {editing ? "Cancel" : "Edit"}
             </Button>
             <Button type="button" variant="outline" onClick={handleToggleVerification} className="h-auto rounded-lg px-4 py-2 text-xs font-semibold">
               {user.email_verified_at ? "Unverify Email" : "Verify Email"}
             </Button>
             <Button type="button" onClick={handleToggleSuspension} className={`h-auto rounded-lg px-4 py-2 text-xs font-semibold text-white ${isSuspended ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}>
               {isSuspended ? "Unsuspend" : "Suspend"}
             </Button>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-base font-semibold">User Information</h2>
        {editing ? (
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="u-name" className="text-xs text-muted-foreground">Full Name</Label>
                <Input id="u-name" type="text" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className="mt-1 rounded-xl px-4 py-2.5 focus-visible:border-brand focus-visible:ring-brand" />
              </div>
              <div>
                <Label htmlFor="u-phone" className="text-xs text-muted-foreground">Phone</Label>
                <Input id="u-phone" type="text" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="mt-1 rounded-xl px-4 py-2.5 focus-visible:border-brand focus-visible:ring-brand" />
              </div>
              <div>
                <Label htmlFor="u-email" className="text-xs text-muted-foreground">Email</Label>
                <Input id="u-email" type="text" value={user.email} disabled className="mt-1 cursor-not-allowed rounded-xl bg-surface px-4 py-2.5 text-muted-foreground" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={handleSaveEdit} disabled={saving} className="h-auto gap-2 rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        ) : (
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
              <p className="mt-1 text-sm">{user.email_verified_at?.item ? new Date(user.email_verified_at.item).toLocaleDateString() : "No"}</p>
            </div>
          </div>
        )}
      </section>

      {/* Seller Link Placeholder */}
      {user.seller && (
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
