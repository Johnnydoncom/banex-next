"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  type LucideIcon,
  Menu,
  LogOut,
  Bell,
  Search,
  ChevronRight,
  X,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"
import { useAuth, signOut } from "@/hooks/use-auth"
import { toast } from "sonner"
import Image from "next/image"

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  exact?: boolean
  badge?: number
}

type Props = {
  title: string
  subtitle?: string
  nav: NavItem[]
  accent: "brand" | "emerald"
  children: ReactNode
  guard?: () => { ok: boolean; redirectTo: string } | null
}

export function AdminShell({ title, subtitle, nav, accent, children, guard }: Props) {
  const path = usePathname()
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

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

  // Extract page name from path for breadcrumb
  const segments = path.replace("/admin", "").split("/").filter(Boolean)
  const pageName = segments.length > 0
    ? segments[segments.length - 1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Overview"

  const userName =
    ((user as any)?.name as string | undefined) ||
    ((user as any)?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Admin"

  const userInitials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-brand border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading admin console…</p>
        </div>
      </div>
    )
  }

  const sidebarWidth = collapsed ? "w-[68px]" : "w-64"

  const SidebarNav = ({ showLabels = true }: { showLabels?: boolean }) => (
    <nav className="flex flex-col gap-0.5">
      {nav.map((item) => {
        const active = isActive(item.to, item.exact)
        return (
          <Link
            key={item.to}
            href={item.to}
            title={!showLabels ? item.label : undefined}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all ${
              active
                ? `bg-gradient-to-r ${accentClasses} text-primary-foreground shadow-sm`
                : "text-muted-foreground hover:bg-surface hover:text-foreground"
            } ${!showLabels ? "justify-center" : ""}`}
          >
            <item.icon
              className={`h-[18px] w-[18px] flex-shrink-0 ${
                active ? "text-primary-foreground" : "text-brand"
              }`}
            />
            {showLabels && <span>{item.label}</span>}
            {showLabels && item.badge != null && item.badge > 0 && (
              <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
                active
                  ? "bg-white/20 text-primary-foreground"
                  : "bg-brand/10 text-brand-deep"
              }`}>
                {item.badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="flex min-h-screen bg-surface/40">
      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-card transition-all duration-300 lg:flex ${sidebarWidth}`}
      >
        {/* Logo + title */}
        <div className={`flex items-center gap-3 border-b border-border px-4 py-4 ${collapsed ? "justify-center" : ""}`}>
          <Link href="/">
            <Image
              src="/assets/banex-mall-logo.png"
              alt="Banex"
              width={collapsed ? 32 : 100}
              height={collapsed ? 32 : 36}
              className={collapsed ? "h-8 w-8 object-contain" : "h-9 w-auto"}
            />
          </Link>
        </div>

        {/* Console title block */}
        {!collapsed && (
          <div className="border-b border-border px-4 py-3">
            <p className="font-display text-sm font-semibold text-foreground">{title}</p>
            {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}
          </div>
        )}

        {/* Nav links */}
        <div className={`flex-1 overflow-y-auto ${collapsed ? "px-2 py-3" : "px-3 py-3"}`}>
          <SidebarNav showLabels={!collapsed} />
        </div>

        {/* Collapse toggle + Sign out */}
        <div className="border-t border-border px-3 py-3 space-y-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-surface hover:text-foreground"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="h-[18px] w-[18px] text-brand mx-auto" />
            ) : (
              <>
                <PanelLeftClose className="h-[18px] w-[18px] text-brand" />
                <span>Collapse</span>
              </>
            )}
          </button>
          <button
            onClick={handleSignOut}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-surface hover:text-foreground ${collapsed ? "justify-center" : ""}`}
            title="Sign out"
          >
            <LogOut className="h-[18px] w-[18px] text-brand flex-shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* ── Mobile Overlay Sidebar ──────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 flex h-full w-72 flex-col bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <Link href="/" onClick={() => setMobileOpen(false)}>
                <Image src="/assets/banex-mall-logo.png" alt="Banex" width={100} height={32} className="h-8 w-auto" />
              </Link>
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="border-b border-border px-4 py-3">
              <p className="font-display text-sm font-semibold">{title}</p>
              {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <SidebarNav showLabels />
            </div>
            <div className="border-t border-border px-3 py-3">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-muted-foreground hover:bg-surface hover:text-foreground"
              >
                <LogOut className="h-[18px] w-[18px] text-brand" /> Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Main area ───────────────────────────────────────────────── */}
      <div className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${collapsed ? "lg:ml-[68px]" : "lg:ml-64"}`}>
        {/* ── Top Header Bar ──────────────────────────────────────── */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur md:px-6">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg border border-border p-2 text-muted-foreground lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Breadcrumb */}
          <div className="hidden items-center gap-1.5 text-sm lg:flex">
            <Link href="/admin" className="text-muted-foreground hover:text-foreground">
              Admin
            </Link>
            {segments.length > 0 && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                <span className="font-medium text-foreground">{pageName}</span>
              </>
            )}
          </div>

          {/* Mobile title */}
          <p className="font-display text-sm font-semibold lg:hidden">{pageName}</p>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <div className="hidden items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1.5 md:flex">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              placeholder="Search…"
              className="w-40 bg-transparent text-xs outline-none placeholder:text-muted-foreground/60 lg:w-56"
            />
          </div>

          {/* Notifications */}
          <button className="relative rounded-lg border border-border p-2 text-muted-foreground hover:bg-surface hover:text-foreground">
            <Bell className="h-4 w-4" />
          </button>

          {/* User avatar */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-deep text-[11px] font-bold text-primary-foreground">
              {userInitials}
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-semibold text-foreground leading-tight">{userName}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Administrator</p>
            </div>
          </div>
        </header>

        {/* ── Page Content ────────────────────────────────────────── */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  Stat Card (enhanced for full-width grid)                                  */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function AdminStatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "brand",
  trend,
}: {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  accent?: "brand" | "emerald" | "amber" | "rose"
  trend?: { value: string; up: boolean }
}) {
  const tones: Record<string, string> = {
    brand: "from-brand/15 to-brand/5 text-brand",
    emerald: "from-emerald-500/15 to-emerald-500/5 text-emerald-600",
    amber: "from-amber-500/15 to-amber-500/5 text-amber-600",
    rose: "from-rose-500/15 to-rose-500/5 text-rose-600",
  }
  const trendColors = trend
    ? trend.up
      ? "text-emerald-600 bg-emerald-500/10"
      : "text-rose-600 bg-rose-500/10"
    : ""

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${tones[accent]} opacity-60`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1.5 font-display text-2xl font-bold">{value}</p>
          {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
          {trend && (
            <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${trendColors}`}>
              {trend.up ? "↑" : "↓"} {trend.value}
            </span>
          )}
        </div>
        <span className={`rounded-xl bg-gradient-to-br ${tones[accent]} p-2.5`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  )
}
