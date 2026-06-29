"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, X, Loader2, Store } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import {
  fetchAdminCategories,
  fetchAdminWhatsAppContacts,
  storeAdminSeller,
  AdminCategory,
  AdminWhatsAppContact,
} from "@/lib/admin-api"
import { RichTextEditor } from "@/components/RichTextEditor"

export default function AdminNewSellerPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [form, setForm] = useState({
    shop_name: "",
    phone: "",
    category_id: "",
    description: "",
    location: "",
    floor: "",
    shop_no: "",
    operating_hours: "",
    tier: "standard",
    is_kyc_verified: false,
    whatsapp_contact_id: "", // Note: might not be strictly required for create, but good to have
  })

  const [coverImage, setCoverImage] = useState<{ file: File; preview: string } | null>(null)
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [contacts, setContacts] = useState<AdminWhatsAppContact[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }))

  useEffect(() => {
    if (session?.accessToken) {
      loadData(session.accessToken)
    }
  }, [session?.accessToken])

  const loadData = async (token: string) => {
    try {
      setLoadingData(true)
      const [catsRes, contactsRes] = await Promise.all([
        fetchAdminCategories(token),
        fetchAdminWhatsAppContacts(token),
      ])
      setCategories(catsRes.data?.categories || [])
      setContacts(contactsRes.data?.whatsapp_contacts || [])
    } catch (err: any) {
      toast.error(err.message || "Failed to load categories")
    } finally {
      setLoadingData(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setCoverImage({
        file,
        preview: URL.createObjectURL(file),
      })
    }
  }

  const removeImage = () => {
    if (coverImage) {
      URL.revokeObjectURL(coverImage.preview)
    }
    setCoverImage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.shop_name) return toast.error("Shop name is required.")

    setSubmitting(true)
    const formData = new FormData()

    formData.append("shop_name", form.shop_name)
    if (form.phone) formData.append("phone", form.phone)
    if (form.category_id) formData.append("category_id", form.category_id)
    if (form.description) formData.append("description", form.description)
    if (form.location) formData.append("location", form.location)
    if (form.floor) formData.append("floor", form.floor)
    if (form.shop_no) formData.append("shop_no", form.shop_no)
    if (form.operating_hours) formData.append("operating_hours", form.operating_hours)
    formData.append("tier", form.tier)
    formData.append("is_kyc_verified", form.is_kyc_verified ? "1" : "0")
    if (form.whatsapp_contact_id) formData.append("whatsapp_contact_id", form.whatsapp_contact_id)
    
    if (coverImage?.file) {
      formData.append("cover_image", coverImage.file)
    }

    try {
      const res = await storeAdminSeller(formData, session?.accessToken as string)
      toast.success("Seller created successfully.")
      router.push(`/admin/users/sellers/${res.data?.seller?.slug || ""}`)
    } catch (error: any) {
      toast.error(error.message || "Failed to create seller")
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-r-transparent"></div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users/sellers"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Store className="h-5 w-5 text-brand" /> Add New Seller
          </h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting || !form.shop_name}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-deep disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Seller
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content (Left Column) */}
        <div className="md:col-span-2 space-y-6">
          {/* Basic Info */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Shop Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.shop_name}
                  onChange={(e) => update("shop_name", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  placeholder="e.g. Banex Store"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    placeholder="e.g. +234..."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">WhatsApp Contact</label>
                  <select
                    value={form.whatsapp_contact_id}
                    onChange={(e) => update("whatsapp_contact_id", e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option value="">Select a contact</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>{c.label} ({c.phone_number})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Primary Category</label>
                <select
                  value={form.category_id}
                  onChange={(e) => update("category_id", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Description</label>
                <div className="overflow-hidden rounded-xl border border-border">
                  <RichTextEditor value={form.description} onChange={(val) => update("description", val)} />
                </div>
              </div>
            </div>
          </section>

          {/* Location & Details */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold mb-4">Location Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-foreground">General Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  placeholder="e.g. Main Plaza"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Floor</label>
                <input
                  type="text"
                  value={form.floor}
                  onChange={(e) => update("floor", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  placeholder="e.g. 1st Floor"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Shop No</label>
                <input
                  type="text"
                  value={form.shop_no}
                  onChange={(e) => update("shop_no", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  placeholder="e.g. B24"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Operating Hours</label>
                <input
                  type="text"
                  value={form.operating_hours}
                  onChange={(e) => update("operating_hours", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  placeholder="e.g. Mon-Sat: 9AM - 6PM"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar (Right Column) */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold mb-4">Settings</h2>
            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Store Tier</label>
                <select
                  value={form.tier}
                  onChange={(e) => update("tier", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="anchor_tenant">Anchor Tenant</option>
                </select>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">KYC Verified</p>
                  <p className="text-xs text-muted-foreground">Store identity confirmed</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={form.is_kyc_verified}
                    onChange={(e) => update("is_kyc_verified", e.target.checked)}
                  />
                  <div className="h-6 w-11 rounded-full bg-surface peer-checked:bg-emerald-500 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold mb-4">Cover Image</h2>
            {!coverImage ? (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface py-10 transition-colors hover:border-brand hover:bg-brand-soft/20">
                <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Click to upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="relative overflow-hidden rounded-xl border border-border">
                <img src={coverImage.preview} alt="Cover Preview" className="h-40 w-full object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute right-2 top-2 rounded-lg bg-black/50 p-1.5 text-white backdrop-blur-md hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
