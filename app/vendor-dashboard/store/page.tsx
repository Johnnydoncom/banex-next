"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import Image from "next/image"

export default function VendorStorePage() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    logo_url: "",
    banner_url: "",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    // ----- ACTUAL FETCH IMPLEMENTATION -----
    /*
    async function fetchStore() {
      try {
        const token = (user as any).accessToken
        const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" }
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        
        const res = await fetch(`${apiUrl}/vendor/store`, { headers })
        const data = await res.json()
        if (data?.data) {
          setForm({
            name: data.data.name || "",
            slug: data.data.slug || "",
            description: data.data.description || "",
            logo_url: data.data.logo_url || "",
            banner_url: data.data.banner_url || ""
          })
        }
      } catch (err) {}
    }
    fetchStore()
    */

    // ----- MOCK DATA -----
    setForm({
      name: "Johnny's Electronics",
      slug: "johnnys-electronics",
      description: "Best electronics in town.",
      logo_url: "",
      banner_url: "",
    })
  }, [user?.id])

  const save = async () => {
    if (!user) return
    setSaving(true)
    // ----- ACTUAL FETCH IMPLEMENTATION -----
    /*
    try {
      const token = (user as any).accessToken
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      
      const res = await fetch(`${apiUrl}/vendor/store`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error("Failed to update store profile")
      toast.success("Store profile updated")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
    */
    
    setTimeout(() => {
      toast.success("Store profile updated")
      setSaving(false)
    }, 800)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Store Profile</h1>
        <p className="text-sm text-muted-foreground">Customize how your store appears to customers.</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-6 aspect-[3/1] w-full overflow-hidden rounded-xl bg-surface relative">
          {form.banner_url ? (
            <Image src={form.banner_url} alt="Banner" fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No banner uploaded</div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="text-[11px] font-medium text-muted-foreground">Store Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-emerald-500"
            />
          </label>
          <label>
            <span className="text-[11px] font-medium text-muted-foreground">Store URL Slug</span>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-emerald-500"
            />
          </label>
          <label>
            <span className="text-[11px] font-medium text-muted-foreground">Logo URL</span>
            <input
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-emerald-500"
            />
          </label>
          <label className="md:col-span-2">
            <span className="text-[11px] font-medium text-muted-foreground">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-emerald-500"
            />
          </label>
          <label className="md:col-span-2">
            <span className="text-[11px] font-medium text-muted-foreground">Banner URL</span>
            <input
              value={form.banner_url}
              onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-emerald-500"
            />
          </label>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="mt-5 rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </section>
    </div>
  )
}

