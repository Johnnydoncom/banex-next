"use client"

import { useState } from "react"
import { Save } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AccountSettingsPage() {
  const { session } = useAuth()
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [saving, setSaving] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    setSaving(true)

    try {
      const token = (session as any)?.accessToken
      if (!token) throw new Error("Not authenticated")

      const res = await fetch(`/api/proxy/user/password`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          current_password: form.currentPassword,
          password: form.newPassword,
          password_confirmation: form.confirmPassword
        })
      })

      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to update password")
      }

      toast.success("Password updated successfully.")
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (err: any) {
      toast.error(err.message || "An error occurred.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold">Account Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your security and preferences.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold mb-4">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Current Password</Label>
            <Input type="password" value={form.currentPassword} onChange={(e) => setForm(f => ({ ...f, currentPassword: e.target.value }))} required className="rounded-xl px-4 py-2.5" />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">New Password</Label>
            <Input type="password" value={form.newPassword} onChange={(e) => setForm(f => ({ ...f, newPassword: e.target.value }))} required className="rounded-xl px-4 py-2.5" />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Confirm New Password</Label>
            <Input type="password" value={form.confirmPassword} onChange={(e) => setForm(f => ({ ...f, confirmPassword: e.target.value }))} required className="rounded-xl px-4 py-2.5" />
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={saving || !form.currentPassword || !form.newPassword} className="h-auto gap-2 rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand">
              <Save className="h-4 w-4" /> {saving ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6">
        <h2 className="font-display text-lg font-semibold text-rose-600 mb-2">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mb-4">Once you delete your account, there is no going back. Please be certain.</p>
        <Button type="button" variant="outline" className="h-auto rounded-xl border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50">
          Delete Account
        </Button>
      </div>
    </div>
  )
}
