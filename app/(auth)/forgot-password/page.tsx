"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"
import { Loader2, MailCheck } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import { AuthShell } from "@/components/AuthShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const schema = z.string().trim().email("Enter a valid email").max(255)

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const parsed = schema.safeParse(email)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message)
      return
    }
    setLoading(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api-marketplace.banexmall.com/api"
      const res = await fetch(`${API_URL}/auth/password/forgot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(data?.message || data?.error || "Failed to send reset link")
        setLoading(false)
        return
      }

      setLoading(false)
      setSent(true)
    } catch (err) {
      toast.error("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthShell
        eyebrow="Check your inbox"
        title="Reset link sent"
        description={`If an account exists for ${email}, we've sent password reset instructions.`}
        footer={
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Back to sign in
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface/40 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft/40">
            <MailCheck className="h-5 w-5 text-brand-deep" />
          </div>
          <p className="text-sm text-muted-foreground">
            The link expires in 1 hour. Check your spam folder if it's not in your inbox.
          </p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Forgot password"
      title="Reset your password"
      description="We'll email you a secure link to set a new one."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Email
          </Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="h-11 rounded-xl px-4 focus-visible:border-brand"
            required
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-full bg-gradient-brand text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
        </Button>
      </form>
    </AuthShell>
  )
}
