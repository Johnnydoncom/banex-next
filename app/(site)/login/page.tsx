"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import { signIn, getSession } from "next-auth/react"
import { AuthShell } from "@/components/AuthShell"

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
})

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const parsed = schema.safeParse({ email, password })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message)
      return
    }
    setLoading(true)

    const result = await signIn("credentials", {
      redirect: false,
      email: parsed.data.email,
      password: parsed.data.password,
    })

    setLoading(false)

    if (result?.error) {
      toast.error(result.error)
      return
    }

    toast.success("Welcome back!")

    const session = await getSession()
    const userRole = (session?.user as any)?.role

    if (userRole === "vendor") {
      router.push("/vendor-dashboard")
    } else if (userRole === "admin") {
      router.push("/admin")
    } else {
      router.push("/account")
    }
    router.refresh()
  }

  const handleGoogle = async () => {
    setOauthLoading(true)
    await signIn("google", { callbackUrl: "/dashboard-redirect" })
    setOauthLoading(false)
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to Banex Mall"
      description="Track orders, save favourites, and check out faster."
      footer={
        <>
          New to Banex?{" "}
          <Link href="/signup" className="font-semibold text-brand hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <button
        type="button"
        onClick={handleGoogle}
        disabled={oauthLoading}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:border-brand disabled:opacity-60"
      >
        {oauthLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-brand"
            required
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs font-semibold text-brand hover:underline">
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 w-full rounded-xl border border-border bg-background px-4 pr-11 text-sm outline-none transition-colors focus:border-brand"
              required
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex h-11 w-full items-center justify-center rounded-full bg-gradient-brand text-sm font-semibold text-primary-foreground shadow-soft transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
        </button>
      </form>
    </AuthShell>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.12A6.95 6.95 0 015.5 12c0-.74.13-1.46.34-2.12V7.04H2.18A11 11 0 001 12c0 1.78.43 3.46 1.18 4.96l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  )
}
