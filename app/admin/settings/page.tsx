"use client"

import { useState, useEffect } from "react"
import { Save, Loader2, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { fetchAdminPaymentMethods, updateAdminPaymentMethod, type AdminPaymentMethod } from "@/lib/admin-api"

export default function AdminSettingsPage() {
  const [form, setForm] = useState({
    siteName: "Banex Mall Marketplace",
    supportEmail: "support@banexmall.com",
    vendorCommission: "5",
    baseDeliveryFee: "1500",
    allowNewVendors: true,
  })
  const [saving, setSaving] = useState(false)

  const { session } = useAuth()
  const token = (session as any)?.accessToken as string | undefined

  const [paymentMethods, setPaymentMethods] = useState<AdminPaymentMethod[]>([])
  const [loadingPMs, setLoadingPMs] = useState(true)

  useEffect(() => {
    if (!token) return
    setLoadingPMs(true)
    fetchAdminPaymentMethods(token)
      .then((res) => setPaymentMethods(res.data?.payment_methods || []))
      .catch((err) => toast.error("Failed to load payment methods"))
      .finally(() => setLoadingPMs(false))
  }, [token])

  const togglePaymentMethod = async (pm: AdminPaymentMethod) => {
    if (!token) return
    const updatedStatus = !pm.is_active
    // Optimistic update
    setPaymentMethods(prev => prev.map(p => p.id === pm.id ? { ...p, is_active: updatedStatus } : p))
    try {
      await updateAdminPaymentMethod(pm.id, { is_active: updatedStatus }, token)
      toast.success(`${pm.name} is now ${updatedStatus ? "active" : "inactive"}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to update payment method")
      // Revert on failure
      setPaymentMethods(prev => prev.map(p => p.id === pm.id ? { ...p, is_active: !updatedStatus } : p))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    toast.success("Settings saved successfully.")
    setSaving(false)
  }

  return (
    <div className="space-y-6 container">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure global marketplace preferences.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-8">
        {/* General Settings */}
        <section>
          <h2 className="font-display text-lg font-semibold border-b border-border pb-2 mb-4">General</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Site Name</label>
              <input type="text" value={form.siteName} onChange={(e) => setForm(f => ({ ...f, siteName: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Support Email</label>
              <input type="email" value={form.supportEmail} onChange={(e) => setForm(f => ({ ...f, supportEmail: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm" />
            </div>
          </div>
        </section>

        {/* Financials */}
        <section>
          <h2 className="font-display text-lg font-semibold border-b border-border pb-2 mb-4">Financials</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Vendor Commission Rate (%)</label>
              <input type="number" value={form.vendorCommission} onChange={(e) => setForm(f => ({ ...f, vendorCommission: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm" />
              <p className="mt-1 text-[11px] text-muted-foreground">Percentage taken from each vendor sale.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Base Delivery Fee (₦)</label>
              <input type="number" value={form.baseDeliveryFee} onChange={(e) => setForm(f => ({ ...f, baseDeliveryFee: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm" />
            </div>
          </div>
        </section>

        {/* Features */}
        <section>
          <h2 className="font-display text-lg font-semibold border-b border-border pb-2 mb-4">Features</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.allowNewVendors} onChange={(e) => setForm(f => ({ ...f, allowNewVendors: e.target.checked }))} className="h-5 w-5 rounded border-border text-brand focus:ring-brand" />
            <div>
              <span className="text-sm font-medium block">Allow New Vendor Applications</span>
              <span className="text-xs text-muted-foreground">If disabled, the "Become a Vendor" form will be hidden.</span>
            </div>
          </label>
        </section>

        {/* Payment Methods */}
        <section>
          <h2 className="font-display text-lg font-semibold border-b border-border pb-2 mb-4 flex items-center gap-2"><CreditCard className="h-5 w-5 text-brand" /> Payment Methods</h2>
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
              {paymentMethods.map(pm => (
                <div key={pm.id} className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
                  <div>
                    <h3 className="font-semibold">{pm.name}</h3>
                    <p className="text-xs text-muted-foreground">ID: {pm.slug}</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" className="peer sr-only" checked={pm.is_active} onChange={() => togglePaymentMethod(pm)} />
                    <div className="peer h-6 w-11 rounded-full bg-border after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:border-gray-600"></div>
                  </label>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex justify-end pt-4">
          <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand disabled:opacity-60">
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  )
}
