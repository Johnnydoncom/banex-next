"use client"

import { useState } from "react"
import { Store, Upload, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export default function BecomeVendorPage() {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    storeName: "",
    description: "",
    phone: "",
    address: "",
  })

  const [idFile, setIdFile] = useState<File | null>(null)

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async () => {
    setSubmitting(true)
    
    // ----- ACTUAL FETCH IMPLEMENTATION -----
    /*
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => formData.append(k, v))
      if (idFile) formData.append("id_document", idFile)

      const token = ... // from session
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      await fetch(`${apiUrl}/seller/apply`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // don't set Content-Type for FormData
        body: formData
      })
    } catch (err) {}
    */

    await new Promise((r) => setTimeout(r, 1500))
    setSubmitting(false)
    setSubmitted(true)
    toast.success("Application submitted successfully!")
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-emerald-100 p-4">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <h2 className="mt-6 font-display text-2xl font-bold">Application Received!</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Thank you for applying to become a vendor. Our team is reviewing your details and will get back to you shortly. You will be notified via email once approved.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-2xl border border-brand/20 bg-gradient-to-r from-brand/10 to-brand/5 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/20">
            <Store className="h-6 w-6 text-brand" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">Become a Vendor</h1>
            <p className="text-sm text-muted-foreground">Reach thousands of customers on Banex Mall.</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        {/* Step Indicators */}
        <div className="mb-8 flex items-center justify-between">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-1 items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${step >= s ? 'bg-brand text-white' : 'bg-surface text-muted-foreground'}`}>
                {s}
              </div>
              {s < 3 && <div className={`h-1 flex-1 mx-2 rounded-full ${step > s ? 'bg-brand' : 'bg-surface'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Business Info */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="font-display text-lg font-semibold">Store Information</h2>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Store Name</label>
              <input type="text" value={form.storeName} onChange={(e) => update("storeName", e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm" placeholder="e.g. My Awesome Store" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Store Description</label>
              <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm" placeholder="Tell customers what you sell..." />
            </div>
          </div>
        )}

        {/* Step 2: Contact Info */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="font-display text-lg font-semibold">Contact Details</h2>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Business Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm" placeholder="+234..." />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Business Address</label>
              <textarea value={form.address} onChange={(e) => update("address", e.target.value)} rows={2} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm" placeholder="Full physical address..." />
            </div>
          </div>
        )}

        {/* Step 3: Verification */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="font-display text-lg font-semibold">Identity Verification</h2>
            <p className="text-sm text-muted-foreground">Please upload a valid government-issued ID (National ID, Passport, Driver's License) for verification.</p>
            
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-brand hover:bg-brand/5">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">Click to upload ID document</span>
              <span className="text-xs text-muted-foreground">JPG, PNG or PDF (Max 5MB)</span>
              <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => setIdFile(e.target.files?.[0] || null)} />
            </label>
            {idFile && (
              <div className="rounded-xl bg-surface p-3 text-sm flex items-center justify-between">
                <span className="truncate">{idFile.name}</span>
                <span className="text-xs text-emerald-600 font-medium">Attached</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-between border-t border-border pt-6">
          <button onClick={() => setStep(s => s - 1)} disabled={step === 1} className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground disabled:opacity-0">
            Back
          </button>
          
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} className="rounded-xl bg-gradient-brand px-6 py-2 text-sm font-semibold text-primary-foreground">
              Next Step
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="rounded-xl bg-gradient-brand px-6 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-70">
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
