"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Upload, X, Loader2, Store, Check, Ban } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import {
  fetchAdminCategories,
  fetchAdminSeller,
  updateAdminSeller,
  toggleAdminSellerApproval,
  toggleAdminSellerSuspension,
  fetchAdminWhatsAppContacts,
  fetchAdminSellerTiers,
  AdminCategory,
  AdminSeller,
  AdminWhatsAppContact,
  AdminSellerTier,
} from "@/lib/admin-api"
import { RichTextEditor } from "@/components/RichTextEditor"
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminEditSellerPage() {
  const params = useParams()
  const id = params.slug as string
  const router = useRouter()
  const { data: session } = useSession()

  const [seller, setSeller] = useState<AdminSeller | null>(null)
  const [form, setForm] = useState({
    shop_name: "",
    phone: "",
    category_id: "",
    description: "",
    location: "",
    floor: "",
    shop_no: "",
    operating_hours: "",
    tier: "",
    is_kyc_verified: false,
    whatsapp_contact_id: "",
  })

  const [existingCoverImage, setExistingCoverImage] = useState<string | null>(null)
  const [newCoverImage, setNewCoverImage] = useState<{ file: File; preview: string } | null>(null)
  const [removeCoverImage, setRemoveCoverImage] = useState(false)

  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [contacts, setContacts] = useState<AdminWhatsAppContact[]>([])
  const [tiers, setTiers] = useState<AdminSellerTier[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Status Action State
  const [statusLoading, setStatusLoading] = useState(false)

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }))

  useEffect(() => {
    if (session?.accessToken && id) {
      loadData(session.accessToken)
    }
  }, [session?.accessToken, id])

  const loadData = async (token: string) => {
    try {
      setLoadingData(true)
      const [catsRes, sellerRes, contactsRes, tiersRes] = await Promise.all([
        fetchAdminCategories(token),
        fetchAdminSeller(id, token),
        fetchAdminWhatsAppContacts(token),
        fetchAdminSellerTiers(token),
      ])

      setCategories(catsRes.data?.categories || [])
      setContacts(contactsRes.data?.whatsapp_contacts || [])
      setTiers(tiersRes.data?.seller_tiers || [])

      const s = sellerRes.data?.seller
      if (s) {
        setSeller(s)
        setForm({
          shop_name: s.shop_name || "",
          phone: s.phone || "",
          category_id: s.category_id || "",
          description: s.description || "",
          location: s.location || "",
          floor: s.floor || "",
          shop_no: s.shop_no || "",
          operating_hours: s.operating_hours || "",
          // The update endpoint keys tier by slug (UUID is silently ignored), so bind by slug.
          tier: (typeof s.tier === "string" ? s.tier : s.tier?.slug) || "",
          is_kyc_verified: s.is_kyc_verified === 1 || s.is_kyc_verified === true,
          whatsapp_contact_id: s.whatsapp_contact_id || "",
        })
        setExistingCoverImage(s.cover_image_url || null)
      } else {
        toast.error("Seller not found")
        router.push("/admin/users/sellers")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load seller")
    } finally {
      setLoadingData(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setNewCoverImage({
        file,
        preview: URL.createObjectURL(file),
      })
      setRemoveCoverImage(false)
    }
  }

  const clearNewImage = () => {
    if (newCoverImage) {
      URL.revokeObjectURL(newCoverImage.preview)
    }
    setNewCoverImage(null)
  }

  const handleRemoveExistingImage = () => {
    setExistingCoverImage(null)
    setRemoveCoverImage(true)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!form.shop_name) return toast.error("Shop name is required.")

    setSubmitting(true)
    const formData = new FormData()

    formData.append("_method", "PUT")
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

    if (newCoverImage?.file) {
      formData.append("cover_image", newCoverImage.file)
    } else if (removeCoverImage) {
      formData.append("remove_cover_image", "1")
    }

    try {
      await updateAdminSeller(id, formData, session?.accessToken as string)
      toast.success("Seller updated successfully.")
      // Reload seller data
      await loadData(session?.accessToken as string)
    } catch (error: any) {
      toast.error(error.message || "Failed to update seller")
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleApproval = async () => {
    setStatusLoading(true)
    try {
      await toggleAdminSellerApproval(id, session?.accessToken as string)
      toast.success(seller?.status === "approved" ? "Seller approval revoked." : "Seller approved.")
      await loadData(session?.accessToken as string)
    } catch (err: any) {
      toast.error(err.message || "Failed to update seller approval")
    } finally {
      setStatusLoading(false)
    }
  }

  const handleToggleSuspension = async () => {
    setStatusLoading(true)
    try {
      await toggleAdminSellerSuspension(id, session?.accessToken as string)
      toast.success(seller?.status === "suspended" ? "Seller unsuspended." : "Seller suspended.")
      await loadData(session?.accessToken as string)
    } catch (err: any) {
      toast.error(err.message || "Failed to update seller suspension")
    } finally {
      setStatusLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-r-transparent"></div>
      </div>
    )
  }

  if (!seller) return null

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users/sellers"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <Store className="h-5 w-5 text-brand" /> Edit Seller
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Editing: {seller.shop_name}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content (Left Column) */}
        <div className="md:col-span-2 space-y-6">
          {/* Basic Info */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Shop Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="text"
                  value={form.shop_name}
                  onChange={(e) => update("shop_name", e.target.value)}
                  className="rounded-xl px-3 py-2.5 focus-visible:border-brand focus-visible:ring-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block text-xs font-semibold text-foreground">Phone</Label>
                  <Input
                    type="text"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="rounded-xl px-3 py-2.5 focus-visible:border-brand focus-visible:ring-brand"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-semibold text-foreground">WhatsApp Contact</Label>
                  <Select value={form.whatsapp_contact_id} onValueChange={(v) => update("whatsapp_contact_id", v)}>
                    <SelectTrigger className="h-auto rounded-xl px-3 py-2.5"><SelectValue placeholder="Select a contact" /></SelectTrigger>
                    <SelectContent>
                      {contacts.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.label} ({c.phone_number})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="mb-1.5 block text-xs font-semibold text-foreground">Primary Category</Label>
                <Select value={form.category_id} onValueChange={(v) => update("category_id", v)}>
                  <SelectTrigger className="h-auto rounded-xl px-3 py-2.5"><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-1.5 block text-xs font-semibold text-foreground">Description</Label>
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
                <Label className="mb-1.5 block text-xs font-semibold text-foreground">General Location</Label>
                <Input
                  type="text"
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                  className="rounded-xl px-3 py-2.5 focus-visible:border-brand focus-visible:ring-brand"
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-semibold text-foreground">Floor</Label>
                <Input
                  type="text"
                  value={form.floor}
                  onChange={(e) => update("floor", e.target.value)}
                  className="rounded-xl px-3 py-2.5 focus-visible:border-brand focus-visible:ring-brand"
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-semibold text-foreground">Shop No</Label>
                <Input
                  type="text"
                  value={form.shop_no}
                  onChange={(e) => update("shop_no", e.target.value)}
                  className="rounded-xl px-3 py-2.5 focus-visible:border-brand focus-visible:ring-brand"
                />
              </div>
              <div className="col-span-2">
                <Label className="mb-1.5 block text-xs font-semibold text-foreground">Operating Hours</Label>
                <Input
                  type="text"
                  value={form.operating_hours}
                  onChange={(e) => update("operating_hours", e.target.value)}
                  className="rounded-xl px-3 py-2.5 focus-visible:border-brand focus-visible:ring-brand"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar (Right Column) */}
        <div className="space-y-6">

          {/* Status Actions */}
          <section className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border bg-surface/30">
              <h2 className="font-display text-lg font-bold">Status</h2>
              <div className="mt-3">
                <StatusBadge status={seller.status} />
              </div>
              {seller.rejection_reason && seller.status === "rejected" && (
                <div className="mt-3 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-600 border border-rose-500/20">
                  <p className="font-semibold mb-1">Rejection Reason:</p>
                  <p>{seller.rejection_reason}</p>
                </div>
              )}
            </div>

            <div className="p-5 space-y-3">
              {(seller.status === "pending" || seller.status === "rejected") && (
                <Button
                  type="button"
                  onClick={handleToggleApproval}
                  disabled={statusLoading}
                  className="h-auto w-full gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  {statusLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Approve Seller
                </Button>
              )}

              {seller.status === "approved" && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleToggleSuspension}
                    disabled={statusLoading}
                    className="h-auto w-full gap-2 rounded-xl border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:hover:bg-rose-900/50"
                  >
                    {statusLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                    Suspend Seller
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleToggleApproval}
                    disabled={statusLoading}
                    className="h-auto w-full gap-2 rounded-xl bg-surface px-4 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                    Revoke Approval
                  </Button>
                </>
              )}

              {seller.status === "suspended" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleToggleSuspension}
                  disabled={statusLoading}
                  className="h-auto w-full gap-2 rounded-xl border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-600 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50"
                >
                  {statusLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Unsuspend Seller
                </Button>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold mb-4">Settings</h2>
            <div className="space-y-5">
              <div>
                <Label className="mb-1.5 block text-xs font-semibold text-foreground">Store Tier</Label>
                <Select value={form.tier} onValueChange={(v) => update("tier", v)} disabled={tiers.length === 0}>
                  <SelectTrigger className="h-auto rounded-xl px-3 py-2.5">
                    <SelectValue placeholder={tiers.length === 0 ? "No tiers available" : "Select a tier"} />
                  </SelectTrigger>
                  <SelectContent>
                    {tiers.map((t) => (
                      <SelectItem key={t.slug} value={t.slug}>
                        {t.name}
                        {t.commission_percent != null && (
                          <span className="ml-1 text-xs text-muted-foreground">· {t.commission_percent}%</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">KYC Verified</p>
                  <p className="text-xs text-muted-foreground">Store identity confirmed</p>
                </div>
                <Switch
                  checked={form.is_kyc_verified}
                  onCheckedChange={(v) => update("is_kyc_verified", v)}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold mb-4">Cover Image</h2>

            {/* Show new image preview if selected, otherwise existing image, otherwise upload box */}
            {newCoverImage ? (
              <div className="relative overflow-hidden rounded-xl border border-border">
                <img src={newCoverImage.preview} alt="New Cover Preview" className="h-40 w-full object-cover" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={clearNewImage}
                  className="absolute right-2 top-2 h-auto w-auto rounded-lg bg-black/50 p-1.5 text-white backdrop-blur-md hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : existingCoverImage && !removeCoverImage ? (
              <div className="relative overflow-hidden rounded-xl border border-border">
                <img src={existingCoverImage} alt="Cover Preview" className="h-40 w-full object-cover" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveExistingImage}
                  className="absolute right-2 top-2 h-auto w-auto rounded-lg bg-black/50 p-1.5 text-white backdrop-blur-md hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface py-10 transition-colors hover:border-brand hover:bg-brand-soft/20">
                <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Click to upload new cover</span>
                <Input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </section>

          <Button
            type="button"
            onClick={() => handleSubmit()}
            disabled={submitting || !form.shop_name}
            className="h-auto w-full gap-2 rounded-full bg-gradient-to-r from-brand to-brand-deep px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-deep"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
