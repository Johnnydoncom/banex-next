"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, type FormEvent, Suspense } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import { AuthShell } from "@/components/AuthShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const schema = z.object({
  code: z.string().length(6, "OTP must be 6 characters"),
})

function OTPForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const parsed = schema.safeParse({ code })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message)
      return
    }
    setLoading(true)

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api-marketplace.banexmall.com/api"
      // Replace with your actual OTP verification endpoint if different
      const res = await fetch(`${API_URL}/auth/email/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ email, code: code }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.success) {
        toast.error(data?.message || data?.error || "Invalid verification code.")
        setLoading(false)
        return
      }

      toast.success("Email verified successfully!")
      router.push("/")
      router.refresh()
    } catch (err) {
      toast.error("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) {
      toast.error("Email is missing. Cannot resend OTP.")
      return
    }
    setResending(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api-marketplace.banexmall.com/api"
      // Replace with your actual resend OTP endpoint if different
      const res = await fetch(`${API_URL}/auth/email/otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(data?.message || "Failed to resend OTP.")
        setResending(false)
        return
      }

      toast.success("A new verification code has been sent.")
    } catch (err) {
      toast.error("Failed to resend OTP.")
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Verify Email"
      title="Enter Verification Code"
      description={`We sent a 6-digit code to ${email || "your email"}. Enter it below to verify your account.`}
      footer={
        <>
          Didn't receive the code?{" "}
          <Button
            type="button"
            variant="link"
            onClick={handleResend}
            disabled={resending}
            className="h-auto p-0 font-semibold text-brand hover:underline"
          >
            {resending ? "Resending..." : "Resend code"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
            Verification Code
          </Label>
          <Input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="h-14 rounded-xl px-4 text-center text-2xl tracking-widest focus-visible:border-brand"
            required
            maxLength={6}
            autoComplete="one-time-code"
          />
        </div>

        <Button
          type="submit"
          disabled={loading || code.length !== 6}
          className="h-11 w-full rounded-full bg-gradient-brand text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Account"}
        </Button>
      </form>
    </AuthShell>
  )
}

export default function OTPPage() {
  return (
    <Suspense fallback={
      <AuthShell title="Loading..." description="Please wait while we load the verification screen.">
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </AuthShell>
    }>
      <OTPForm />
    </Suspense>
  )
}
