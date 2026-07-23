"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false)

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      ;(e.target as HTMLFormElement).reset()
      toast.success("Message sent — we'll respond within 24 hours.")
    }, 700)
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Your name</label>
          <Input required className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand" />
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <Input type="email" required className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Subject</label>
        <Input required className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand" />
      </div>
      <div>
        <label className="text-sm font-medium">Message</label>
        <Textarea required rows={5} className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-brand" />
      </div>
      <Button variant="ghost" type="button" disabled={submitting} className="inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-brand text-sm font-semibold text-primary-foreground disabled:opacity-60">
        {submitting ? "Sending…" : "Send message"}
      </Button>
    </form>
  )
}
