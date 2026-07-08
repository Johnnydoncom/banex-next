"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
export default function VendorSettingsPage() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    notifications_email: true,
    notifications_sms: false,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return

    // In a real implementation, you would fetch these from the API
    setForm({
      notifications_email: true,
      notifications_sms: false,
    })
  }, [user])

  const save = async () => {
    if (!user) return
    setSaving(true)

    // API Call here...

    setTimeout(() => {
      toast.success("Settings updated")
      setSaving(false)
    }, 800)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your notification preferences.</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-semibold">Notifications</h2>
        <p className="mb-5 text-xs text-muted-foreground">How should we contact you about new orders and payouts?</p>

        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <Checkbox
              checked={form.notifications_email}
              onCheckedChange={(checked) => setForm({ ...form, notifications_email: checked as boolean })}
            />
            <span className="text-sm font-medium">Email notifications</span>
          </label>
          <label className="flex items-center gap-3">
            <Checkbox
              checked={form.notifications_sms}
              onCheckedChange={(checked) => setForm({ ...form, notifications_sms: checked as boolean })}
            />
            <span className="text-sm font-medium">SMS notifications</span>
          </label>
        </div>
      </section>

      <button
        onClick={save}
        disabled={saving}
        className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60 hover:bg-emerald-700 transition-colors"
      >
        {saving ? "Saving…" : "Save Settings"}
      </button>
    </div>
  )
}

