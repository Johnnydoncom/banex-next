"use client"

import { useState, useEffect } from "react"
import { Store, Upload, CheckCircle2, X, Loader2, ImageIcon, Clock, Truck, MapPin, Phone, Mail, Tag, Info } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { fetchGenericCategories, GenericCategory } from "@/lib/generic-api"


export default function BecomeVendorPage() {
  const { data: session, status } = useSession()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState<GenericCategory[]>([])
  const [loadingCats, setLoadingCats] = useState(true)

  const [existingApp, setExistingApp] = useState<any>(null)
  const [checkingApp, setCheckingApp] = useState(true)

  const [form, setForm] = useState({
    shop_name: "",
    email: (session?.user?.email as string) || "",
    phone: "",
    category_id: "",
    description: "",
    location: "",
    floor: "",
    shop_no: "",
    operating_hours: "",
    delivery_estimate_minutes: "",
    delivery_fee: "",
  })
  const [coverImage, setCoverImage] = useState<{ file: File; preview: string } | null>(null)

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }))

  useEffect(() => {
    fetchGenericCategories()
      .then((d) => setCategories(d?.categories ?? []))
      .catch(() => toast.error("Failed to load categories"))
      .finally(() => setLoadingCats(false))
  }, [])

  useEffect(() => {
    if (session?.user?.email) {
      update("email", session.user.email as string)
    }

    if (status === "loading") return
    if (status === "unauthenticated" || !session?.accessToken) {
      setCheckingApp(false)
      return
    }

    const checkApp = async () => {
      try {
        const res = await fetch("/api/proxy/seller/application", {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        })
        if (!res.ok) {
          setCheckingApp(false)
          return
        }
        const data = await res.json()
        if (data?.success && data?.data?.seller) {
          setExistingApp(data.data.seller)
        }
      } catch (err) {
        console.error("Error checking application", err)
      } finally {
        setCheckingApp(false)
      }
    }
    checkApp()
  }, [session, status])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB")
      return
    }
    setCoverImage({ file, preview: URL.createObjectURL(file) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation of required fields
    if (!form.shop_name.trim()) return toast.error("Shop name is required")
    if (!form.phone.trim()) return toast.error("Phone number is required")
    if (!form.email.trim()) return toast.error("Email is required")
    if (!form.category_id) return toast.error("Please select a business category")
    if (!form.location) return toast.error("Please select your shop location")
    if (!form.floor.trim()) return toast.error("Floor is required")
    if (!form.shop_no.trim()) return toast.error("Shop number is required")

    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("shop_name", form.shop_name)
      formData.append("email", form.email)
      formData.append("phone", form.phone)
      formData.append("category_id", form.category_id)
      formData.append("location", form.location)
      formData.append("floor", form.floor)
      formData.append("shop_no", form.shop_no)
      if (form.description) formData.append("description", form.description)
      if (form.operating_hours) formData.append("operating_hours", form.operating_hours)
      if (form.delivery_estimate_minutes) formData.append("delivery_estimate_minutes", form.delivery_estimate_minutes)
      if (form.delivery_fee) formData.append("delivery_fee", form.delivery_fee)
      if (coverImage?.file) formData.append("cover_image", coverImage.file)

      const res = await fetch("/api/proxy/seller/apply", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: formData,
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json?.message || "Failed to submit application")
      }

      setSubmitted(true)
      toast.success("Application submitted successfully!")
    } catch (err: any) {
      toast.error(err.message || "An error occurred. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Initial Loading State ──────────────────────────────────────────────────
  if (checkingApp) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center py-20 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand" />
        <p className="mt-4 text-sm text-muted-foreground">Checking application status...</p>
      </div>
    )
  }

  // ─── Existing Application State ──────────────────────────────────────────────
  if (existingApp) {
    const isApproved = existingApp.status === "approved"
    const isPending = existingApp.status === "pending"
    const isRejected = existingApp.status === "rejected"
    
    return (
      <div className="mx-auto max-w-2xl pb-12">
        <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-6">
          <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
            {isApproved ? (
              <div className="rounded-full bg-emerald-500/15 p-4">
                 <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              </div>
            ) : isPending ? (
              <div className="rounded-full bg-amber-500/15 p-4">
                 <Clock className="h-12 w-12 text-amber-500" />
              </div>
            ) : isRejected ? (
              <div className="rounded-full bg-rose-500/15 p-4">
                 <X className="h-12 w-12 text-rose-500" />
              </div>
            ) : (
              <div className="rounded-full bg-brand/15 p-4">
                 <Store className="h-12 w-12 text-brand" />
              </div>
            )}
          </div>
          
          <div>
            <h2 className="font-display text-2xl font-bold">
              {isApproved ? "Application Approved!" : isPending ? "Application Pending" : isRejected ? "Application Rejected" : `Application Status: ${existingApp.status}`}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              {isApproved ? "Congratulations! Your seller application has been approved. You can now access the vendor dashboard." : 
               isPending ? "Your application is currently under review. We will notify you once a decision has been made." : 
               isRejected ? "Unfortunately, your application has been rejected at this time." : "Your application has been received."}
            </p>
          </div>

          <div className="mx-auto max-w-sm rounded-xl border border-border bg-surface p-4 text-left">
             <h3 className="text-sm font-semibold mb-3">Application Details</h3>
             <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                   <span className="text-muted-foreground">Shop Name</span>
                   <span className="font-medium">{existingApp.shop_name}</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-muted-foreground">Location</span>
                   <span className="font-medium">{existingApp.store_location || existingApp.location}</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-muted-foreground">Status</span>
                   <span className="font-medium capitalize">{existingApp.status}</span>
                </div>
                {existingApp.rejection_reason && (
                  <div className="pt-2 mt-2 border-t border-border">
                     <span className="text-muted-foreground block mb-1">Reason:</span>
                     <span className="font-medium text-rose-500">{existingApp.rejection_reason}</span>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Success State ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
        </div>
        <h2 className="mt-8 font-display text-2xl font-bold">Application Received!</h2>
        <p className="mt-3 max-w-md text-sm text-muted-foreground leading-relaxed">
          Thank you for applying to become a vendor on Banex Mall. Our team is reviewing your details and will notify you via email once your application is approved.
        </p>
        <div className="mt-8 rounded-2xl border border-brand/20 bg-brand/5 px-8 py-5 text-sm text-brand font-medium">
          ⏱ Review typically takes 1–2 business days
        </div>
      </div>
    )
  }

  // ─── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand/15 via-brand/8 to-transparent border border-brand/20 p-6">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-brand/20 shadow-inner">
            <Store className="h-7 w-7 text-brand" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">Become a Vendor</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Reach thousands of shoppers on Banex Mall. Fill in your store details to apply.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Store Identity ──────────────────────────────────────────── */}
        <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10">
              <Store className="h-3.5 w-3.5 text-brand" />
            </div>
            <h2 className="font-display text-base font-semibold">Store Identity</h2>
          </div>

          {/* Shop Name */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Shop Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.shop_name}
              onChange={(e) => update("shop_name", e.target.value)}
              placeholder="e.g. Samsung Store"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Business Category <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Tag className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <select
                required
                value={form.category_id}
                onChange={(e) => update("category_id", e.target.value)}
                className="w-full appearance-none rounded-xl border border-border bg-background pl-9 pr-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="">{loadingCats ? "Loading categories..." : "Select a category"}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Store Description <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              placeholder="Tell shoppers what you sell and what makes your store special..."
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand resize-none"
            />
          </div>
        </section>

        {/* ── Contact Details ─────────────────────────────────────────── */}
        <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10">
              <Phone className="h-3.5 w-3.5 text-brand" />
            </div>
            <h2 className="font-display text-base font-semibold">Contact Details</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="store@example.com"
                  className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+234 800 000 0000"
                  className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Physical Location ────────────────────────────────────────── */}
        <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10">
              <MapPin className="h-3.5 w-3.5 text-brand" />
            </div>
            <h2 className="font-display text-base font-semibold">Physical Location</h2>
          </div>

          {/* Location (Plot) */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Mall Location <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                required
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder="e.g. Plot 10"
                className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Floor */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Floor <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.floor}
                onChange={(e) => update("floor", e.target.value)}
                placeholder="e.g. Ground Floor"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            {/* Shop No */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Shop Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.shop_no}
                onChange={(e) => update("shop_no", e.target.value)}
                placeholder="e.g. 015"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          {/* Operating Hours */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Operating Hours <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
            </label>
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={form.operating_hours}
                onChange={(e) => update("operating_hours", e.target.value)}
                placeholder="e.g. Mon–Sun 9:00 – 21:00"
                className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>
        </section>

        {/* ── Delivery Information ─────────────────────────────────────── */}
        <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10">
              <Truck className="h-3.5 w-3.5 text-brand" />
            </div>
            <h2 className="font-display text-base font-semibold">Delivery Information</h2>
            <span className="ml-auto text-xs text-muted-foreground">Optional</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Delivery Estimate */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">Delivery Time (minutes)</label>
              <input
                type="number"
                min={1}
                value={form.delivery_estimate_minutes}
                onChange={(e) => update("delivery_estimate_minutes", e.target.value)}
                placeholder="e.g. 30"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <p className="mt-1 text-xs text-muted-foreground">Estimated delivery in minutes</p>
            </div>

            {/* Delivery Fee */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">Delivery Fee (NGN)</label>
              <input
                type="number"
                min={0}
                value={form.delivery_fee}
                onChange={(e) => update("delivery_fee", e.target.value)}
                placeholder="e.g. 1500"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <p className="mt-1 text-xs text-muted-foreground">Minimum delivery fee in Naira</p>
            </div>
          </div>
        </section>

        {/* ── Cover Image ──────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10">
              <ImageIcon className="h-3.5 w-3.5 text-brand" />
            </div>
            <h2 className="font-display text-base font-semibold">Store Cover Image</h2>
            <span className="ml-auto text-xs text-muted-foreground">Optional</span>
          </div>

          {coverImage ? (
            <div className="relative overflow-hidden rounded-xl border border-border">
              <img src={coverImage.preview} alt="Cover preview" className="h-44 w-full object-cover" />
              <button
                type="button"
                onClick={() => setCoverImage(null)}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="absolute bottom-2 left-2 rounded-lg bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                {coverImage.file.name}
              </div>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border p-10 text-center transition-all hover:border-brand hover:bg-brand/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Click to upload a cover image</p>
                <p className="mt-0.5 text-xs text-muted-foreground">PNG, JPG or WEBP · Max 5MB · Recommended 1200×400</p>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
          )}
        </section>

        {/* ── Note ────────────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your application will be reviewed by our admin team. You will be notified by email once a decision is made. Ensure all information provided is accurate.
          </p>
        </div>

        {/* ── Submit ───────────────────────────────────────────────────── */}
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-brand to-brand-deep py-3.5 text-sm font-bold text-white shadow-lg shadow-brand/25 transition-all hover:opacity-90 hover:shadow-xl disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting Application…
            </>
          ) : (
            <>
              <Store className="h-4 w-4" />
              Submit Vendor Application
            </>
          )}
        </button>
      </form>
    </div>
  )
}
