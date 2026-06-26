"use client"

import { useState } from "react"
import { Save } from "lucide-react"
import { toast } from "sonner"

export default function AccountSettingsPage() {
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
    
    // ----- ACTUAL FETCH IMPLEMENTATION -----
    /*
    try {
      const token = ... // from session
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      await fetch(`${apiUrl}/user/password`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          current_password: form.currentPassword,
          new_password: form.newPassword,
          new_password_confirmation: form.confirmPassword
        })
      })
    } catch (err) {}
    */

    await new Promise((r) => setTimeout(r, 800))
    toast.success("Password updated successfully.")
    setForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    setSaving(false)
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
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Current Password</label>
            <input type="password" value={form.currentPassword} onChange={(e) => setForm(f => ({...f, currentPassword: e.target.value}))} required className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">New Password</label>
            <input type="password" value={form.newPassword} onChange={(e) => setForm(f => ({...f, newPassword: e.target.value}))} required className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Confirm New Password</label>
            <input type="password" value={form.confirmPassword} onChange={(e) => setForm(f => ({...f, confirmPassword: e.target.value}))} required className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm" />
          </div>

          <div className="pt-2">
            <button type="submit" disabled={saving || !form.currentPassword || !form.newPassword} className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand disabled:opacity-60">
              <Save className="h-4 w-4" /> {saving ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
      
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6">
        <h2 className="font-display text-lg font-semibold text-rose-600 mb-2">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mb-4">Once you delete your account, there is no going back. Please be certain.</p>
        <button className="rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50">
          Delete Account
        </button>
      </div>
    </div>
  )
}
