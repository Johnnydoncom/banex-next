"use client"

import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { Upload, Store, Star, Package2, Clock, CheckCircle2, XCircle, MapPin } from "lucide-react"
import { sellerUpdateProfile, type SellerProfile } from "@/lib/seller-api"
import { useSellerApplication, useCategories } from "@/hooks/use-swr-data"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
function statusBanner(profile: SellerProfile) {
  if (profile.status === "approved") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
        <span>Your store is <strong>approved</strong> and live on the marketplace.</span>
      </div>
    )
  }
  if (profile.status === "pending") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
        <Clock className="h-4 w-4 flex-shrink-0" />
        <span>Application is <strong>under review</strong>. We'll notify you once approved.</span>
      </div>
    )
  }
  if (profile.status === "rejected") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700">
        <XCircle className="h-4 w-4 flex-shrink-0" />
        <span><strong>Rejected:</strong> {profile.rejection_reason ?? "Your application was rejected."}</span>
      </div>
    )
  }
  return null
}

export default function VendorStorePage() {
  const { user, session } = useAuth()
  const token = (session as any)?.accessToken as string | undefined

  const { profile: swrProfile, loading: profileLoading, mutate: mutateProfile } = useSellerApplication(token)
  const { categories } = useCategories()

  const [profile, setProfile] = useState<SellerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    shop_name: "",
    phone: "",
    description: "",
    location: "",
    floor: "",
    shop_no: "",
    operating_hours: "",
    delivery_estimate_minutes: "",
    delivery_fee: "",
    category_id: "",
  })

  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [removeCover, setRemoveCover] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync SWR profile into local state
  useEffect(() => {
    if (swrProfile !== undefined) {
      setProfile((swrProfile as SellerProfile | null) ?? null)
      setLoading(false)
      if (swrProfile) {
        const p = swrProfile as SellerProfile
        setForm({
          shop_name: p.shop_name ?? "",
          phone: p.phone ?? "",
          description: p.description ?? "",
          location: p.location ?? "",
          floor: p.floor ?? "",
          shop_no: p.shop_no ?? "",
          operating_hours: p.operating_hours ?? "",
          delivery_estimate_minutes: String(p.delivery_estimate_minutes ?? ""),
          delivery_fee: String(p.delivery_fee ?? ""),
          category_id: p.category_id ?? "",
        })
        setCoverPreview(p.cover_image_url ?? null)
      }
    }
  }, [swrProfile])

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverImageFile(file)
    setCoverPreview(URL.createObjectURL(file))
    setRemoveCover(false)
  }

  async function save() {
    if (!token) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append("_method", "PUT")
      // Text fields
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
      if (coverImageFile) fd.append("cover_image", coverImageFile)
      fd.append("remove_cover_image", removeCover ? "1" : "0")

      const updated = await sellerUpdateProfile(fd, token)
      if (updated) {
        setProfile(updated)
        setCoverPreview(updated.cover_image_url ?? null)
        setCoverImageFile(null)
        toast.success("Store profile updated")
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface" />
        <div className="h-48 animate-pulse rounded-2xl border border-border bg-card" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Store Profile</h1>
        <p className="text-sm text-muted-foreground">Customize how your store appears on the marketplace.</p>
      </div>

      {profile && statusBanner(profile)}

      {/* Store stats strip */}
      {profile && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="font-display text-xl font-bold text-emerald-600">{profile.products_count}</p>
            <p className="mt-0.5 text-xs text-muted-foreground flex items-center justify-center gap-1"><Package2 className="h-3 w-3" /> Products</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="font-display text-xl font-bold text-amber-500">{profile.rating_average?.toFixed(1) ?? "—"}</p>
            <p className="mt-0.5 text-xs text-muted-foreground flex items-center justify-center gap-1"><Star className="h-3 w-3" /> Rating</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="font-display text-xl font-bold">{profile.reviews_count}</p>
            <p className="mt-0.5 text-xs text-muted-foreground flex items-center justify-center gap-1"><Store className="h-3 w-3" /> Reviews</p>
          </div>
        </div>
      )}

      {/* Cover image */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-3 font-display text-sm font-semibold">Cover Image</p>
        <div
          className="relative mb-3 aspect-[3/1] w-full cursor-pointer overflow-hidden rounded-xl border border-dashed border-border bg-surface"
          onClick={() => fileInputRef.current?.click()}
        >
          {coverPreview ? (
            <img src={coverPreview} alt="Cover" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <Upload className="h-8 w-8" />
              <p className="text-sm font-medium">Click to upload cover image</p>
              <p className="text-xs">Recommended: 1200×400px</p>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors">
            <Upload className="h-6 w-6 text-white opacity-0 hover:opacity-100" />
          </div>
        </div>
        <Input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="h-auto rounded-full bg-card px-4 py-1.5 text-xs font-semibold hover:border-emerald-500 hover:text-emerald-600"
          >
            {coverPreview ? "Change image" : "Upload image"}
          </Button>
          {coverPreview && (
            <Button
              type="button"
              variant="outline"
              onClick={() => { setCoverPreview(null); setCoverImageFile(null); setRemoveCover(true) }}
              className="h-auto rounded-full border-rose-500/30 bg-rose-500/10 px-4 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-500/20"
            >
              Remove
            </Button>
          )}
        </div>
      </section>

      {/* Store details form */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-4 font-display text-sm font-semibold">Store Details</p>
        <div className="grid gap-4 md:grid-cols-2">
          <SField label="Shop Name" className="md:col-span-2">
            <Input value={form.shop_name} onChange={(e) => setForm({ ...form, shop_name: e.target.value })} placeholder="e.g. Samsung Store" />
          </SField>
          <SField label="Phone">
            <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234 800 000 0000" />
          </SField>
          <SField label="Category">
            <Select value={form.category_id} onValueChange={(val) => setForm({ ...form, category_id: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </SField>
          <SField label="Description" className="md:col-span-2">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe your store..." />
          </SField>
        </div>
      </section>

      {/* Physical location */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-1 font-display text-sm font-semibold">Physical Location</p>
        <p className="mb-4 text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Your shop location within Banex Mall</p>
        <div className="grid gap-4 md:grid-cols-3">
          <SField label="Plot / Area" className="md:col-span-1">
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Plot 10" />
          </SField>
          <SField label="Floor">
            <Input value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} placeholder="e.g. Ground Floor" />
          </SField>
          <SField label="Shop No.">
            <Input value={form.shop_no} onChange={(e) => setForm({ ...form, shop_no: e.target.value })} placeholder="e.g. 015" />
          </SField>
          <SField label="Operating Hours" className="md:col-span-2">
            <Input value={form.operating_hours} onChange={(e) => setForm({ ...form, operating_hours: e.target.value })} placeholder="e.g. Mon-Sun 9:00 - 21:00" />
          </SField>
        </div>
      </section>

      {/* Delivery */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-4 font-display text-sm font-semibold">Delivery Settings</p>
        <div className="grid gap-4 md:grid-cols-2">
          <SField label="Delivery Estimate (minutes)">
            <Input type="number" value={form.delivery_estimate_minutes} onChange={(e) => setForm({ ...form, delivery_estimate_minutes: e.target.value })} placeholder="e.g. 60" />
          </SField>
          <SField label="Delivery Fee (₦)">
            <Input type="number" value={form.delivery_fee} onChange={(e) => setForm({ ...form, delivery_fee: e.target.value })} placeholder="e.g. 500" />
          </SField>
        </div>
      </section>

      <Button
        type="button"
        onClick={save}
        disabled={saving}
        className="h-auto rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        {saving ? "Saving…" : "Save Store Profile"}
      </Button>
    </div>
  )
}

function SField({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}
