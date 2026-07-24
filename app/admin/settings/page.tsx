"use client"

import { useState, useEffect } from "react"
import { Loader2, CreditCard, Mail, Bell, Landmark, Save, X, Plus } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import {
  fetchAdminPaymentMethods,
  updateAdminPaymentMethod,
  fetchAdminSettings,
  updateAdminSettings,
  type AdminPaymentMethod,
  type AdminSettings,
} from "@/lib/admin-api"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const emptyManual = { bank_name: "", account_name: "", account_number: "", instructions: "" }

export default function AdminSettingsPage() {
  const { session } = useAuth()
  const token = (session as any)?.accessToken as string | undefined

  // ── Site settings ──────────────────────────────────────────────────────────
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [supportEmail, setSupportEmail] = useState("")
  const [notifyEmails, setNotifyEmails] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [manual, setManual] = useState({ ...emptyManual })

  // ── Payment methods ────────────────────────────────────────────────────────
  const [paymentMethods, setPaymentMethods] = useState<AdminPaymentMethod[]>([])
  const [loadingPMs, setLoadingPMs] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    setLoadingSettings(true)
    fetchAdminSettings(token)
      .then((res) => hydrate(res.data?.settings))
      .catch((err) => toast.error(err.message || "Failed to load settings"))
      .finally(() => setLoadingSettings(false))

    setLoadingPMs(true)
    fetchAdminPaymentMethods(token)
      .then((res) => setPaymentMethods(res.data?.payment_methods || []))
      .catch(() => toast.error("Failed to load payment methods"))
      .finally(() => setLoadingPMs(false))
  }, [token])

  function hydrate(s?: AdminSettings) {
    if (!s) return
    setSupportEmail(s.support_email ?? "")
    setNotifyEmails(s.admin_notification_emails ?? [])
    setManual({
      bank_name: s.manual_payment?.bank_name ?? "",
      account_name: s.manual_payment?.account_name ?? "",
      account_number: s.manual_payment?.account_number ?? "",
      instructions: s.manual_payment?.instructions ?? "",
    })
  }

  const addNotifyEmail = () => {
    const email = newEmail.trim().toLowerCase()
    if (!email) return
    if (!EMAIL_RE.test(email)) return toast.error("Enter a valid email address")
    if (notifyEmails.includes(email)) return toast.error("That email is already added")
    setNotifyEmails((prev) => [...prev, email])
    setNewEmail("")
  }

  const removeNotifyEmail = (email: string) =>
    setNotifyEmails((prev) => prev.filter((e) => e !== email))

  const saveSettings = async () => {
    if (!token) return
    if (supportEmail && !EMAIL_RE.test(supportEmail.trim())) {
      return toast.error("Support email is not valid")
    }
    setSavingSettings(true)
    try {
      const res = await updateAdminSettings(
        {
          support_email: supportEmail.trim() || null,
          admin_notification_emails: notifyEmails,
          manual_payment: {
            bank_name: manual.bank_name.trim() || null,
            account_name: manual.account_name.trim() || null,
            account_number: manual.account_number.trim() || null,
            instructions: manual.instructions.trim() || null,
          },
        },
        token
      )
      hydrate(res.data?.settings)
      toast.success("Settings saved")
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings")
    } finally {
      setSavingSettings(false)
    }
  }

  const togglePaymentMethod = async (pm: AdminPaymentMethod) => {
    if (!token) return
    const nextStatus = pm.status !== "active" ? "active" : "inactive"
    setSavingId(pm.id)
    setPaymentMethods((prev) => prev.map((p) => (p.id === pm.id ? { ...p, status: nextStatus } : p)))
    try {
      await updateAdminPaymentMethod(pm.id, { status: nextStatus }, token)
      toast.success(`${pm.name} is now ${nextStatus}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to update payment method")
      setPaymentMethods((prev) => prev.map((p) => (p.id === pm.id ? { ...p, status: pm.status } : p)))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6 container">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage marketplace-wide settings. These values are used across the site (support contact, admin
          alerts, and bank-transfer instructions shown to buyers).
        </p>
      </div>

      {/* ── Site settings ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6">
        {loadingSettings ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* General */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 border-b border-border pb-2 font-display text-lg font-semibold">
                <Mail className="h-5 w-5 text-brand" /> Support Contact
              </h2>
              <div className="max-w-md">
                <Label htmlFor="support-email" className="mb-1.5 block text-xs text-muted-foreground">
                  Support email
                </Label>
                <Input
                  id="support-email"
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="support@banexmall.com"
                  className="rounded-xl px-4 py-2.5 focus-visible:border-brand"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Shown to customers on contact and help pages.
                </p>
              </div>
            </section>

            {/* Notification emails */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 border-b border-border pb-2 font-display text-lg font-semibold">
                <Bell className="h-5 w-5 text-brand" /> Admin Notification Emails
              </h2>
              <p className="mb-3 text-sm text-muted-foreground">
                Addresses that receive operational alerts (new orders, seller applications, disputes).
              </p>
              <div className="flex flex-wrap gap-2">
                {notifyEmails.length === 0 && (
                  <span className="text-xs text-muted-foreground">No notification emails added yet.</span>
                )}
                {notifyEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-medium"
                  >
                    {email}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeNotifyEmail(email)}
                      className="h-auto w-auto p-0.5 text-muted-foreground hover:bg-transparent hover:text-rose-600"
                      aria-label={`Remove ${email}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </span>
                ))}
              </div>
              <div className="mt-3 flex max-w-md gap-2">
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addNotifyEmail()
                    }
                  }}
                  placeholder="ops@banexmall.com"
                  className="rounded-xl px-4 py-2.5 focus-visible:border-brand"
                />
                <Button type="button" variant="outline" onClick={addNotifyEmail} className="h-auto gap-1.5 rounded-xl px-4 py-2.5">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
            </section>

            {/* Manual payment (bank transfer) */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 border-b border-border pb-2 font-display text-lg font-semibold">
                <Landmark className="h-5 w-5 text-brand" /> Bank Transfer Details
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Shown to buyers who pay by bank transfer at checkout.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="bank-name" className="mb-1.5 block text-xs text-muted-foreground">Bank name</Label>
                  <Input id="bank-name" value={manual.bank_name} onChange={(e) => setManual((m) => ({ ...m, bank_name: e.target.value }))} className="rounded-xl px-4 py-2.5 focus-visible:border-brand" />
                </div>
                <div>
                  <Label htmlFor="account-name" className="mb-1.5 block text-xs text-muted-foreground">Account name</Label>
                  <Input id="account-name" value={manual.account_name} onChange={(e) => setManual((m) => ({ ...m, account_name: e.target.value }))} className="rounded-xl px-4 py-2.5 focus-visible:border-brand" />
                </div>
                <div>
                  <Label htmlFor="account-number" className="mb-1.5 block text-xs text-muted-foreground">Account number</Label>
                  <Input id="account-number" value={manual.account_number} onChange={(e) => setManual((m) => ({ ...m, account_number: e.target.value }))} className="rounded-xl px-4 py-2.5 font-mono focus-visible:border-brand" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="instructions" className="mb-1.5 block text-xs text-muted-foreground">Instructions</Label>
                  <Textarea id="instructions" rows={3} value={manual.instructions} onChange={(e) => setManual((m) => ({ ...m, instructions: e.target.value }))} className="rounded-xl px-4 py-2.5 resize-none focus-visible:border-brand" placeholder="e.g. Transfer the exact order total, then upload your payment receipt." />
                </div>
              </div>
            </section>

            <div className="flex justify-end border-t border-border pt-4">
              <Button type="button" onClick={saveSettings} disabled={savingSettings} className="h-auto gap-2 rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand">
                {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {savingSettings ? "Saving…" : "Save Settings"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Payment methods ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <section>
          <h2 className="mb-4 flex items-center gap-2 border-b border-border pb-2 font-display text-lg font-semibold">
            <CreditCard className="h-5 w-5 text-brand" /> Payment Methods
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Enable or disable the payment methods buyers can use at checkout.
          </p>
          {loadingPMs ? (
            <div className="flex h-24 items-center justify-center rounded-xl border border-border bg-surface/30">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface/30 p-6 text-center text-sm text-muted-foreground">
              No payment methods found.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {paymentMethods.map((pm) => (
                <div key={pm.id} className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold">{pm.name}</h3>
                    <p className="text-xs text-muted-foreground">{pm.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {savingId === pm.id && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    <Switch
                      checked={pm.status === "active"}
                      disabled={savingId === pm.id}
                      onCheckedChange={() => togglePaymentMethod(pm)}
                      aria-label={`Toggle ${pm.name}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
