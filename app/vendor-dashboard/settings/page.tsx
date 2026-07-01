"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

export default function VendorSettingsPage() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    notifications_email: true,
    notifications_sms: false,
    payout_account: "",
    payout_bank: "",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    // ----- ACTUAL FETCH IMPLEMENTATION -----
    /*
    async function fetchSettings() {
      try {
        const token = (user as any).accessToken
        const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" }
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        
        const res = await fetch(`${apiUrl}/vendor/settings`, { headers })
        const data = await res.json()
        if (data?.data) {
          setForm({
            notifications_email: data.data.notifications_email ?? true,
            notifications_sms: data.data.notifications_sms ?? false,
            payout_account: data.data.payout_account ?? "",
            payout_bank: data.data.payout_bank ?? "",
          })
        }
      } catch (err) {}
    }
    fetchSettings()
    */

    // ----- MOCK DATA -----
    setForm({
      notifications_email: true,
      notifications_sms: false,
      payout_account: "0123456789",
      payout_bank: "GTBank",
    })
  }, [user?.id])

  const save = async () => {
    if (!user) return
    setSaving(true)
    // ----- ACTUAL FETCH IMPLEMENTATION -----
    /*
    try {
      const token = (user as any).accessToken
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      
      const res = await fetch(`${apiUrl}/vendor/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error("Failed to update settings")
      toast.success("Settings updated")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
    */
    
    setTimeout(() => {
      toast.success("Settings updated")
      setSaving(false)
    }, 800)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your payout options and notifications.</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-semibold">Payout Settings</h2>
        <p className="mb-5 text-xs text-muted-foreground">Where should we send your earnings?</p>
        
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="text-[11px] font-medium text-muted-foreground">Bank Name</span>
            <input
              value={form.payout_bank}
              onChange={(e) => setForm({ ...form, payout_bank: e.target.value })}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-emerald-500"
            />
          </label>
          <label>
            <span className="text-[11px] font-medium text-muted-foreground">Account Number</span>
            <input
              value={form.payout_account}
              onChange={(e) => setForm({ ...form, payout_account: e.target.value })}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-emerald-500"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-semibold">Notifications</h2>
        <p className="mb-5 text-xs text-muted-foreground">How should we contact you about new orders?</p>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.notifications_email}
              onChange={(e) => setForm({ ...form, notifications_email: e.target.checked })}
              className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-600"
            />
            <span className="text-sm">Email notifications</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.notifications_sms}
              onChange={(e) => setForm({ ...form, notifications_sms: e.target.checked })}
              className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-600"
            />
            <span className="text-sm">SMS notifications</span>
          </label>
        </div>
      </section>

      <button
        onClick={save}
        disabled={saving}
        className="rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </div>
  )
}

