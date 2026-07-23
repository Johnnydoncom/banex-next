"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function BecomeSellerForm() {
  const [submitting, setSubmitting] = useState(false)
  const [category, setCategory] = useState("")

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
        <Label className="text-sm font-medium">Primary category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="mt-2 h-11 rounded-xl px-3 focus:border-brand">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {["Vehicles","Property","Phones & Tablets","Electronics","Fashion","Home & Furniture","Health & Beauty","Babies & Kids","Sports & Hobbies","Animals & Pets","Food, Agriculture","Services"].map((c)=>(
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium">Tell us about what you sell</label>
        <Textarea name="about" rows={4} className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-brand" placeholder="e.g. New & used iPhones, with warranty and same-day Lagos delivery." />
      </div>

      <Button type="submit" disabled={submitting} className="mt-2 h-12 rounded-full bg-gradient-brand px-8 text-sm font-semibold text-primary-foreground">
        {submitting ? "Submitting…" : "Submit application"}
      </Button>
    </form>
  )
}

function Field({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <Input
        name={name}
        type={type}
        required={required}
        className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand"
      />
    </div>
  )
}
