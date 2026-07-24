"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Bell, CheckCheck, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  fetchAdminNotifications,
  markAllNotificationsRead,
  clearAllNotifications,
  type AdminNotification,
} from "@/lib/admin-api"

function toDate(v: AdminNotification["created_at"]): Date | null {
  if (!v) return null
  const raw = typeof v === "string" ? v : v.item
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

function timeAgo(v: AdminNotification["created_at"]): string {
  const d = toDate(v)
  if (!d) return ""
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString()
}

function title(n: AdminNotification): string {
  return (n.title || n.data?.title || n.message || n.body || n.data?.message || n.type || "Notification") as string
}

function body(n: AdminNotification): string | null {
  const t = title(n)
  const b = (n.message || n.body || n.data?.message || n.data?.body) as string | undefined
  return b && b !== t ? b : null
}

function isUnread(n: AdminNotification): boolean {
  if (typeof n.is_read === "boolean") return !n.is_read
  return !n.read_at
}

export function AdminNotifications() {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken as string | undefined

  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AdminNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetchAdminNotifications(token, 15)
      setItems(res.data?.notifications ?? [])
      setUnread(res.data?.unread_count ?? 0)
    } catch {
      // silent — the bell just shows no badge
    } finally {
      setLoading(false)
    }
  }, [token])

  // Initial load + light polling for the unread badge.
  useEffect(() => {
    if (!token) return
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [token, load])

  const handleMarkAllRead = async () => {
    if (!token || unread === 0) return
    setActing(true)
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: n.read_at ?? "read" })))
    setUnread(0)
    try {
      await markAllNotificationsRead(token)
      load()
    } catch (e: any) {
      toast.error(e.message || "Failed to mark notifications read")
      load()
    } finally {
      setActing(false)
    }
  }

  const handleClearAll = async () => {
    if (!token || items.length === 0) return
    setActing(true)
    const snapshot = items
    setItems([])
    setUnread(0)
    try {
      await clearAllNotifications(token)
      toast.success("Notifications cleared")
    } catch (e: any) {
      toast.error(e.message || "Failed to clear notifications")
      setItems(snapshot)
      load()
    } finally {
      setActing(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) load() }}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          type="button"
          className="relative rounded-lg border border-border p-2 text-muted-foreground hover:bg-surface hover:text-foreground"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="font-display text-sm font-semibold">
            Notifications {unread > 0 && <span className="text-xs font-normal text-muted-foreground">· {unread} unread</span>}
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleMarkAllRead}
              disabled={acting || unread === 0}
              title="Mark all as read"
              className="h-auto w-auto rounded-md p-1.5 text-muted-foreground hover:bg-surface hover:text-emerald-600"
            >
              <CheckCheck className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClearAll}
              disabled={acting || items.length === 0}
              title="Clear all"
              className="h-auto w-auto rounded-md p-1.5 text-muted-foreground hover:bg-surface hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading && items.length === 0 ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">You&apos;re all caught up</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => {
                const link = (n.link || n.url || n.data?.link || n.data?.url) as string | undefined
                const unreadRow = isUnread(n)
                const inner = (
                  <div className="flex gap-3 px-4 py-3">
                    <span className={`mt-1.5 h-2 w-2 flex-none rounded-full ${unreadRow ? "bg-brand" : "bg-transparent"}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${unreadRow ? "font-semibold" : "font-medium"}`}>{title(n)}</p>
                      {body(n) && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{body(n)}</p>}
                      <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                )
                return (
                  <li key={n.id} className="hover:bg-surface/40">
                    {link ? (
                      <Link href={link} onClick={() => setOpen(false)}>{inner}</Link>
                    ) : (
                      inner
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
