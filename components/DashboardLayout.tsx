"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { type LucideIcon, Menu, LogOut } from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth, signOut } from "@/hooks/use-auth"
import { toast } from "sonner"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  exact?: boolean
}

type Props = {
  title: string
  subtitle?: string
  nav: NavItem[]
  accent: "brand" | "emerald"
  children: ReactNode
  /** required role: if user lacks it we redirect to fallback */
  guard?: () => { ok: boolean; redirectTo: string } | null
}

export function DashboardLayout({ title, subtitle, nav, accent, children, guard }: Props) {
  const path = usePathname()
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push("/login?callbackUrl=" + encodeURIComponent(path))
      return
    }
    const g = guard?.()
    if (g && !g.ok) {
      router.push(g.redirectTo)
    }
  }, [loading, user, guard, router, path])

  useEffect(() => setMobileOpen(false), [path])

  const isActive = (to: string, exact?: boolean) =>
    exact ? path === to : path === to || path.startsWith(to + "/")

  const accentClasses =
    accent === "emerald"
      ? "from-emerald-500 to-teal-600"
      : "from-brand to-brand-deep"

  const handleSignOut = async () => {
    await signOut()
    toast.success("Signed out")
    router.push("/")
  }

  const NavList = (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        const active = isActive(item.to, item.exact)
        return (
          <Link
            key={item.to}
            href={item.to}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? `bg-gradient-to-r ${accentClasses} text-primary-foreground shadow-soft`
                : "text-muted-foreground hover:bg-surface hover:text-foreground"
            }`}
          >
            <item.icon className={`h-4 w-4 ${active ? "text-primary-foreground" : "text-brand"}`} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface/40">
      {/* Mobile topbar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background px-4 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" type="button"
              aria-label="Open menu"
              className="rounded-lg border border-border p-2 text-muted-foreground"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="border-b border-border p-4">
              <Link href="/" className="flex items-center gap-2">
                <Image src="/assets/banex-mall-logo.png" alt="Banex" width={100} height={32} className="h-8 w-auto" />
              </Link>
              <p className="mt-3 font-display text-sm font-semibold">{title}</p>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="p-3">{NavList}</div>
            <div className="border-t border-border p-3">
              <Button variant="ghost" type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-surface hover:text-foreground"
              >
                <LogOut className="h-4 w-4 text-brand" /> Sign out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <p className="font-display text-sm font-semibold">{title}</p>
        <Link href="/" className="ml-auto text-xs text-brand">Back to shop</Link>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 md:px-8">
        {/* Desktop sidebar */}
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 flex-none flex-col rounded-2xl border border-border bg-card p-4 lg:flex">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/assets/banex-mall-logo.png" alt="Banex" width={100} height={36} className="h-9 w-auto" />
          </Link>
          <div className="mt-4 rounded-xl bg-surface/60 px-3 py-2.5">
            <p className="font-display text-sm font-semibold">{title}</p>
            {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="mt-4 flex-1 overflow-y-auto">{NavList}</div>
          <div className="mt-3 border-t border-border pt-3">
            <Button variant="ghost" type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-surface hover:text-foreground"
            >
              <LogOut className="h-4 w-4 text-brand" /> Sign out
            </Button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "brand",
}: {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  accent?: "brand" | "emerald" | "amber" | "rose"
}) {
  const tones: Record<string, string> = {
    brand: "from-brand/15 to-brand/0 text-brand",
    emerald: "from-emerald-500/15 to-emerald-500/0 text-emerald-600",
    amber: "from-amber-500/15 to-amber-500/0 text-amber-600",
    rose: "from-rose-500/15 to-rose-500/0 text-rose-600",
  }
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${tones[accent]}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-2xl font-bold">{value}</p>
          {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
        </div>
        <span className={`rounded-xl bg-gradient-to-br ${tones[accent]} p-2`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  )
}
