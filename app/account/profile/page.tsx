"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Store, UserCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useRoles, requestVendorRole } from "@/hooks/use-roles"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ProfilePage() {
  const { user, session } = useAuth()
  const { isVendor } = useRoles()
  const [profile, setProfile] = useState({ full_name: "", phone: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return

    async function fetchProfile() {
      try {
        const token = (session as any)?.accessToken
        if (!token) return
        const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" }
        
        const res = await fetch(`/api/proxy/user/profile`, { headers })
        const data = await res.json()
        if (data?.data?.user) {
          setProfile({
            full_name: data.data.user.full_name ?? "",
            phone: data.data.user.phone ?? "",
          })
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchProfile()
  }, [user?.id, session?.user?.email])

  const save = async () => {
    if (!user) return
    setSaving(true)

    try {
      const token = (session as any)?.accessToken
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" }
      
      const res = await fetch(`/api/proxy/user/profile`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(profile)
      })
      
      const data = await res.json().catch(() => null)
      
      if (!res.ok) throw new Error(data?.message || "Failed to update profile")
      
      toast.success(data?.message || "Profile updated successfully")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const becomeVendor = async () => {
    if (!user) return
    const { error } = await requestVendorRole((user as any).id)
    if (error) toast.error(error.message)
    else toast.success("Vendor access granted — open your dashboard!")
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold">Profile Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your personal information and contact details.</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-5 pb-6 border-b border-border mb-6">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-brand text-2xl font-bold text-primary-foreground shadow-sm">
            {(profile.full_name || user?.email || "U")[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold">{profile.full_name || "Add your name"}</p>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-foreground">Full Name</span>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="h-11 rounded-xl pl-10 pr-4 focus-visible:border-brand focus-visible:ring-brand/30"
                placeholder="Enter your full name"
              />
            </div>
          </label>
          
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-foreground">Phone Number</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground font-medium text-xs flex items-center justify-center">+</span>
              <Input
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="h-11 rounded-xl pl-10 pr-4 focus-visible:border-brand focus-visible:ring-brand/30"
                placeholder="e.g. 2348000000000"
              />
            </div>
          </label>
          
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-semibold text-foreground">Email Address</span>
            <Input
              value={user?.email ?? ""}
              disabled
              className="h-11 rounded-xl bg-surface px-4 text-muted-foreground opacity-70"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Email address cannot be changed.</p>
          </label>
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            type="button"
            onClick={save}
            disabled={saving}
            className="h-auto rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:shadow"
          >
            {saving ? "Saving Changes..." : "Save Changes"}
          </Button>
        </div>
      </section>

      {/* Vendor Section */}
      <section className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-card to-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-600 flex-shrink-0 mt-1 sm:mt-0">
              <Store className="h-6 w-6" />
            </span>
            <div>
              <p className="font-display text-base font-bold text-foreground">
                {isVendor ? "You are a Verified Vendor" : "Start Selling on Banex Mall"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground max-w-md">
                {isVendor 
                  ? "Manage your store, view orders, and track your business performance from your vendor dashboard." 
                  : "Join thousands of sellers. Open your store today and start reaching more customers."}
              </p>
            </div>
          </div>
          {isVendor ? (
            <Link 
              href="/vendor-dashboard" 
              className="flex-shrink-0 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Button
              type="button"
              onClick={becomeVendor}
              className="h-auto flex-shrink-0 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Become a Vendor
            </Button>
          )}
        </div>
      </section>
    </div>
  )
}

