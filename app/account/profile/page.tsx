"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Store } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useRoles, requestVendorRole } from "@/hooks/use-roles"
import { toast } from "sonner"
import Image from "next/image"

export default function ProfilePage() {
  const { user } = useAuth()
  const { isVendor } = useRoles()
  const [profile, setProfile] = useState({ full_name: "", phone: "", avatar_url: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return

    // ----- ACTUAL FETCH IMPLEMENTATION (Commented out) -----
    /*
    async function fetchProfile() {
      try {
        const token = (user as any).accessToken
        const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" }
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        
        const res = await fetch(`${apiUrl}/user/profile`, { headers })
        const data = await res.json()
        if (data?.data) {
          setProfile({
            full_name: data.data.full_name ?? "",
            phone: data.data.phone ?? "",
            avatar_url: data.data.avatar_url ?? ""
          })
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchProfile()
    */

    // ----- MOCK DATA IMPLEMENTATION -----
    setProfile({
      full_name: (user as any).name || "",
      phone: "08012345678",
      avatar_url: ""
    })
  }, [user])

  const save = async () => {
    if (!user) return
    setSaving(true)

    // ----- ACTUAL FETCH IMPLEMENTATION (Commented out) -----
    /*
    try {
      const token = (user as any).accessToken
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      
      const res = await fetch(`${apiUrl}/user/profile`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(profile)
      })
      if (!res.ok) throw new Error("Failed to update profile")
      toast.success("Profile updated")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
    */

    // ----- MOCK SAVE -----
    setTimeout(() => {
      toast.success("Profile updated")
      setSaving(false)
    }, 800)
  }

  const becomeVendor = async () => {
    if (!user) return
    const { error } = await requestVendorRole((user as any).id)
    if (error) toast.error(error.message)
    else toast.success("Vendor access granted — open your dashboard!")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your personal information.</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-brand text-xl font-bold text-primary-foreground">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt="" fill className="object-cover" />
            ) : (
              (profile.full_name || user?.email || "U")[0]?.toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold">{profile.full_name || "Add your name"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <label>
            <span className="text-[11px] font-medium text-muted-foreground">Full name</span>
            <input
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
            />
          </label>
          <label>
            <span className="text-[11px] font-medium text-muted-foreground">Phone</span>
            <input
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="md:col-span-2">
            <span className="text-[11px] font-medium text-muted-foreground">Avatar URL</span>
            <input
              value={profile.avatar_url}
              onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
            />
          </label>
          <label>
            <span className="text-[11px] font-medium text-muted-foreground">Email</span>
            <input value={user?.email ?? ""} disabled className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-muted-foreground" />
          </label>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="mt-5 rounded-full bg-gradient-brand px-5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </section>

      <section className="rounded-2xl border border-border bg-gradient-to-br from-emerald-500/10 via-card to-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-emerald-500/15 p-2 text-emerald-600">
              <Store className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-sm font-semibold">{isVendor ? "You're a vendor" : "Sell on Banex Mall"}</p>
              <p className="text-xs text-muted-foreground">
                {isVendor ? "Manage your store, products and orders." : "Get a free store inside the mall and reach thousands of shoppers."}
              </p>
            </div>
          </div>
          {isVendor ? (
            <Link href="/vendor-dashboard" className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-primary-foreground">
              Open vendor dashboard
            </Link>
          ) : (
            <button onClick={becomeVendor} className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-primary-foreground">
              Become a vendor
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
