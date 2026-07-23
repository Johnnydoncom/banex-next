"use client"

import { useEffect, useState } from "react"
import { Award, Edit2, Loader2, Save, X } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import {
  fetchAdminSellerTiers,
  updateAdminSellerTiers,
  type AdminSellerTier,
} from "@/lib/admin-api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function AdminSellerTiersPage() {
  const { session } = useAuth()
  const token = (session as any)?.accessToken as string | undefined

  const [tiers, setTiers] = useState<AdminSellerTier[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<AdminSellerTier>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetchAdminSellerTiers(token)
      .then((res) => setTiers(res.data?.seller_tiers || []))
      .catch((err) => toast.error(err.message || "Failed to load seller tiers"))
      .finally(() => setLoading(false))
  }, [token])

  const startEdit = (tier: AdminSellerTier) => {
    setEditingId(tier.slug)
    setEditForm({
      name: tier.name,
      commission_percent: tier.commission_percent,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const handleSave = async (tier: AdminSellerTier) => {
    if (!token) return
    setSaving(true)
    try {
      // The API updates tiers in bulk; send the full set with this tier's edits applied.
      const merged = tiers.map((t) =>
        t.slug === tier.slug
          ? {
              id: t.id,
              slug: t.slug,
              name: editForm.name ?? t.name,
              commission_percent: editForm.commission_percent ?? t.commission_percent,
            }
          : { id: t.id, slug: t.slug, name: t.name, commission_percent: t.commission_percent }
      )
      const res = await updateAdminSellerTiers(merged, token)
      if (res.data?.seller_tiers?.length) {
        setTiers(res.data.seller_tiers)
      } else {
        setTiers((prev) =>
          prev.map((t) => (t.slug === tier.slug ? { ...t, name: editForm.name ?? t.name, commission_percent: editForm.commission_percent ?? t.commission_percent } : t))
        )
      }
      toast.success(`Tier "${editForm.name ?? tier.name}" updated successfully`)
      setEditingId(null)
      setEditForm({})
    } catch (err: any) {
      toast.error(err.message || "Failed to update tier")
    } finally {
      setSaving(false)
    }
  }

  const tierColors: Record<string, string> = {
    bronze: "bg-amber-700/10 text-amber-700 border-amber-700/20",
    silver: "bg-slate-400/10 text-slate-500 border-slate-400/20",
    gold: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    platinum: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Award className="h-6 w-6 text-brand" /> Seller Tiers
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure seller tier commission rates and benefits.
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
          <p className="text-sm font-medium text-muted-foreground">Loading seller tiers...</p>
        </div>
      ) : tiers.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          No seller tiers found.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => {
            const isEditing = editingId === tier.slug
            const colorClass =
              tierColors[tier.slug?.toLowerCase()] || "bg-brand/10 text-brand border-brand/20"

            return (
              <div
                key={tier.slug}
                className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-4"
              >
                {/* Tier Header */}
                <div className="flex items-center justify-between">
                  <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold capitalize ${colorClass}`}>
                    <Award className="h-3.5 w-3.5" />
                    {isEditing ? (
                      <Input
                        className="h-auto w-24 border-0 bg-transparent p-0 font-bold shadow-none focus-visible:ring-0"
                        value={editForm.name ?? ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    ) : (
                      tier.name
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSave(tier)}
                          disabled={saving}
                          className="h-auto w-auto rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                          title="Save"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={cancelEdit}
                          className="h-auto w-auto rounded-lg p-1.5 text-muted-foreground hover:bg-surface"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(tier)}
                        className="h-auto w-auto rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Commission */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Commission Rate</p>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        className="h-auto w-24 rounded-lg px-3 py-1.5 text-sm font-semibold"
                        value={editForm.commission_percent ?? ""}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            commission_percent: parseFloat(e.target.value),
                          }))
                        }
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold">{tier.commission_percent}%</p>
                  )}
                </div>

                {/* Meta */}
                <div className="flex-1">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tier.is_active ? "bg-emerald-500/15 text-emerald-700" : "bg-zinc-500/15 text-zinc-600"}`}>
                    {tier.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="text-[10px] text-muted-foreground">
                  Updated {tier.updated_at?.item ? new Date(tier.updated_at.item).toLocaleDateString() : "—"}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
