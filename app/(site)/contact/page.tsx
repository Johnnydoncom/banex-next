"use client"

import { PageShell } from "@/components/PageShell"
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function ContactPage() {
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
    <PageShell
      eyebrow="We're here to help"
      title="Contact Banex Mall"
      description="Reach out about orders, listings, or partnerships. Our team responds within 24 hours."
    >
      <div className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
        <div className="space-y-5">
          {[
            { icon: Phone, t: "Call us", s: "+234 800 BANEX 00", sub: "Mon–Sat, 8am – 7pm" },
            { icon: MessageCircle, t: "WhatsApp", s: "+234 901 234 5678", sub: "Fastest response" },
            { icon: Mail, t: "Email", s: "support@banexmall.ng", sub: "24-hour reply" },
            { icon: MapPin, t: "Head office", s: "Banex Plaza, Wuse 2", sub: "Abuja, Nigeria" },
          ].map(({ icon: Icon, t, s, sub }) => (
            <div key={t} className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft/30">
                <Icon className="h-5 w-5 text-brand-deep" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{t}</p>
                <p className="mt-0.5 font-semibold">{s}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Your name</label>
              <input required className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand" />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input type="email" required className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Subject</label>
            <input required className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand" />
          </div>
          <div>
            <label className="text-sm font-medium">Message</label>
            <textarea required rows={5} className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-brand" />
          </div>
          <button disabled={submitting} className="inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-brand text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {submitting ? "Sending…" : "Send message"}
          </button>
        </form>
      </div>
    </PageShell>
  )
}
