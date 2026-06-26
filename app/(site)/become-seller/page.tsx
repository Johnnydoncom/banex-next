"use client"

import { PageShell } from "@/components/PageShell"
import { useState } from "react"
import { toast } from "sonner"

export default function BecomeSellerPage() {
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      ;(e.target as HTMLFormElement).reset()
      toast.success("Application received! We'll review and reach out within 48 hours.")
    }, 800)
  }

  return (
    <PageShell
      eyebrow="Apply"
      title="Become a verified seller"
      description="Tell us a bit about your business. Approved within 48 hours."
    >
      <form onSubmit={handleSubmit} className="grid gap-5 rounded-3xl border border-border bg-card p-6 shadow-soft md:p-10">
        <Field label="Business / store name" name="business" required />
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Full name" name="name" required />
          <Field label="Phone number" name="phone" type="tel" required />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Email" name="email" type="email" required />
          <Field label="City / location" name="location" required />
        </div>

        <div>
          <label className="text-sm font-medium">Primary category</label>
          <select name="category" required className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand">
            <option value="">Select a category</option>
            {["Vehicles","Property","Phones & Tablets","Electronics","Fashion","Home & Furniture","Health & Beauty","Babies & Kids","Sports & Hobbies","Animals & Pets","Food, Agriculture","Services"].map((c)=>(
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Tell us about what you sell</label>
          <textarea name="about" rows={4} className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-brand" placeholder="e.g. New & used iPhones, with warranty and same-day Lagos delivery." />
        </div>

        <button disabled={submitting} type="submit" className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-gradient-brand px-8 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {submitting ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </PageShell>
  )
}

function Field({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand"
      />
    </div>
  )
}
