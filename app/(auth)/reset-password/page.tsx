"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, type FormEvent } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import { AuthShell } from "@/components/AuthShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Suspense } from "react"

const schema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] })

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const email = searchParams.get("email") || ""

  const [ready] = useState(true)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const parsed = schema.safeParse({ password, confirm })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message)
      return
    }

    if (!token || !email) {
      toast.error("Missing reset token or email. Please request a new password reset link.")
      return
    }

    setLoading(true)

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api-marketplace.banexmall.com/api"
      const res = await fetch(`${API_URL}/auth/password/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          email,
          token,
          password,
          password_confirmation: confirm,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(data?.message || data?.error || "Failed to reset password")
        setLoading(false)
        return
      }

      setLoading(false)
      toast.success(data?.message || "Password updated. Please sign in.")
      router.push("/login")
    } catch (err) {
      toast.error("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Set new password"
      title="Choose a new password"
      description="Make it at least 8 characters. Use something you'll remember."
      footer={
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Back to sign in
        </Link>
      }
    >
      {!ready ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface/40 p-6 text-center text-sm text-muted-foreground">
          Open this page from the password reset email to continue.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              New password
            </Label>
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                className="h-11 rounded-xl px-4 pr-11 focus-visible:border-brand"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 h-auto w-auto -translate-y-1/2 p-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Confirm password
            </Label>
            <Input
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              className="h-11 rounded-xl px-4 focus-visible:border-brand"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-full bg-gradient-brand text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <AuthShell title="Loading..." description="Please wait while we load the password reset screen.">
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </AuthShell>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
