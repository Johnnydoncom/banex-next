"use client"

import { useState } from "react"
import { Loader2, SlidersHorizontal } from "lucide-react"
import { toast } from "sonner"
import {
  bulkUpdateAdminProducts,
  BANEX_MALL_SELLER_ID,
  type AdminProduct,
  type AdminSeller,
  type BulkProductOutcome,
  type BulkProductUpdate,
} from "@/lib/admin-api"
import { useAdminCategories } from "@/hooks/use-swr-data"
import { findCategory } from "@/lib/categories"
import { CategoryTreePicker } from "@/components/CategoryTreePicker"
import { LocationSelect } from "@/components/LocationSelect"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { plural } from "./BulkActions"

type ValueField = "seller_id" | "category_id" | "brand" | "location" | "delivery_estimate"
type FlagField = "is_featured" | "is_nationwide_delivery" | "is_authentic_only"
type FlagChoice = "keep" | "yes" | "no"

const FLAGS: { key: FlagField; label: string }[] = [
  { key: "is_featured", label: "Featured product" },
  { key: "is_nationwide_delivery", label: "Nationwide delivery" },
  { key: "is_authentic_only", label: "Authentic only" },
]

const FLAG_CHOICES: { value: FlagChoice; label: string }[] = [
  { value: "keep", label: "No change" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
]

/** A field that is only sent when its checkbox is ticked. */
function ChangeField({
  checked,
  onCheckedChange,
  label,
  children,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
  children: React.ReactNode
}) {
  return (
    <div className={`rounded-xl border p-3 transition-colors ${checked ? "border-brand/50 bg-brand/5" : "border-border"}`}>
      <Label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
        <Checkbox checked={checked} onCheckedChange={(v) => onCheckedChange(v === true)} /> {label}
      </Label>
      {checked && <div className="mt-3">{children}</div>}
    </div>
  )
}

/**
 * Bulk edit — POST /admin/products/bulk/update. Only the ticked fields are sent,
 * so everything else on the selected products is left untouched.
 */
export function BulkEditModal({
  products,
  sellers,
  token,
  onClose,
  onDone,
}: {
  products: AdminProduct[]
  sellers: AdminSeller[]
  token: string
  onClose: () => void
  onDone: (outcome: BulkProductOutcome) => void
}) {
  const { categories, loading: loadingCategories } = useAdminCategories(token)

  const [on, setOn] = useState<Record<ValueField, boolean>>({
    seller_id: false,
    category_id: false,
    brand: false,
    location: false,
    delivery_estimate: false,
  })
  const [sellerId, setSellerId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [brand, setBrand] = useState("")
  const [location, setLocation] = useState("")
  const [deliveryEstimate, setDeliveryEstimate] = useState("")
  const [flags, setFlags] = useState<Record<FlagField, FlagChoice>>({
    is_featured: "keep",
    is_nationwide_delivery: "keep",
    is_authentic_only: "keep",
  })
  const [saving, setSaving] = useState(false)

  const toggle = (field: ValueField, checked: boolean) => setOn((o) => ({ ...o, [field]: checked }))

  // Categories are seller-scoped: Banex Mall lists anywhere, every other seller
  // only inside their own department. A category can be bulk-assigned only when
  // all the products' owners (or the new owner picked here) share one scope.
  const ownerIds =
    on.seller_id && sellerId
      ? [sellerId]
      : Array.from(new Set(products.map((p) => p.seller?.id || p.seller_id)))
  const departments = new Set<string>()
  let unknownDepartment = false
  for (const ownerId of ownerIds) {
    if (ownerId === BANEX_MALL_SELLER_ID) continue
    const root = findCategory(categories, sellers.find((s) => s.id === ownerId)?.category_id)
    if (root) departments.add(root.id)
    else unknownDepartment = true
  }
  const sharedDepartment = departments.size === 1 ? findCategory(categories, Array.from(departments)[0]) : undefined
  const scopeIssue =
    departments.size > 1
      ? "These products belong to sellers in different departments, so there is no category they can all share. Select products from one seller, or set a new owner above."
      : unknownDepartment
        ? "The department of at least one of these products' sellers couldn't be determined, so the allowed categories are unknown. Set a new owner above, or edit those products individually."
        : null
  const categoryTree = sharedDepartment ? [sharedDepartment] : categories

  // A new owner changes which categories are allowed → drop any picked category.
  const changeSellerToggle = (checked: boolean) => {
    toggle("seller_id", checked)
    setCategoryId("")
  }
  const changeSeller = (id: string) => {
    setSellerId(id)
    setCategoryId("")
  }

  const flagChanges = FLAGS.filter((f) => flags[f.key] !== "keep").length
  const changeCount = Object.values(on).filter(Boolean).length + flagChanges

  const handleApply = async () => {
    const changes: BulkProductUpdate = {}
    if (on.seller_id) {
      if (!sellerId) return toast.error("Choose the new owner, or untick it.")
      changes.seller_id = sellerId
    }
    if (on.category_id) {
      if (!categoryId) return toast.error("Choose a category, or untick it.")
      changes.category_id = categoryId
    }
    if (on.brand) {
      if (!brand.trim()) return toast.error("Enter a brand, or untick it.")
      changes.brand = brand.trim()
    }
    if (on.location) {
      if (!location) return toast.error("Choose a location, or untick it.")
      changes.location = location
    }
    if (on.delivery_estimate) {
      if (!deliveryEstimate.trim()) return toast.error("Enter a delivery estimate, or untick it.")
      changes.delivery_estimate = deliveryEstimate.trim()
    }
    for (const { key } of FLAGS) {
      if (flags[key] !== "keep") changes[key] = flags[key] === "yes"
    }
    if (Object.keys(changes).length === 0) return toast.error("Choose at least one field to change.")

    setSaving(true)
    try {
      const outcome = await bulkUpdateAdminProducts(products.map((p) => p.id), changes, token)
      onDone(outcome)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update products")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-edit-title"
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-card shadow-2xl"
      >
        <div className="border-b border-border px-6 py-4">
          <h3 id="bulk-edit-title" className="flex items-center gap-2 font-display text-lg font-bold">
            <SlidersHorizontal className="h-4 w-4 text-brand" /> Edit {plural(products.length)}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Tick the fields you want to change. Everything else is left exactly as it is.
          </p>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
          <ChangeField checked={on.seller_id} onCheckedChange={changeSellerToggle} label="Owner (seller)">
            <Select value={sellerId} onValueChange={changeSeller}>
              <SelectTrigger className="h-auto rounded-xl px-3 py-2.5"><SelectValue placeholder="Select seller" /></SelectTrigger>
              <SelectContent>
                {sellers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.shop_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1.5 text-[11px] text-muted-foreground">Reassigns which vendor these products belong to.</p>
          </ChangeField>

          <ChangeField checked={on.category_id} onCheckedChange={(c) => toggle("category_id", c)} label="Category">
            {loadingCategories ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-brand" />
              </div>
            ) : scopeIssue ? (
              <p className="rounded-xl border border-amber-300/60 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-300">
                {scopeIssue}
              </p>
            ) : (
              <>
                <CategoryTreePicker nodes={categoryTree} value={categoryId} onChange={setCategoryId} />
                {sharedDepartment && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Limited to {sharedDepartment.name} — the owner&apos;s department.
                  </p>
                )}
              </>
            )}
          </ChangeField>

          <ChangeField checked={on.brand} onCheckedChange={(c) => toggle("brand", c)} label="Brand">
            <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Apple" className="rounded-xl px-3 py-2.5" />
          </ChangeField>

          <ChangeField checked={on.location} onCheckedChange={(c) => toggle("location", c)} label="Location">
            <LocationSelect value={location} onChange={setLocation} placeholder="Select state..." />
          </ChangeField>

          <ChangeField checked={on.delivery_estimate} onCheckedChange={(c) => toggle("delivery_estimate", c)} label="Delivery estimate">
            <Input value={deliveryEstimate} onChange={(e) => setDeliveryEstimate(e.target.value)} placeholder="e.g. 3 - 5 days" className="rounded-xl px-3 py-2.5" />
          </ChangeField>

          <div className="space-y-3 rounded-xl border border-border p-3">
            {FLAGS.map(({ key, label }) => (
              <div key={key} className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold">{label}</span>
                <div className="inline-flex rounded-lg border border-border bg-surface/60 p-0.5" role="group" aria-label={label}>
                  {FLAG_CHOICES.map((choice) => {
                    const active = flags[key] === choice.value
                    return (
                      <button
                        key={choice.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setFlags((f) => ({ ...f, [key]: choice.value }))}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                          active
                            ? choice.value === "keep"
                              ? "bg-card text-foreground shadow-sm"
                              : "bg-brand text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {choice.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
          <p className="text-xs text-muted-foreground">
            {changeCount === 0 ? "No changes yet" : `${plural(changeCount, "change")} to apply`}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="h-auto rounded-xl px-4 py-2 text-xs font-semibold">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              disabled={saving || changeCount === 0}
              className="h-auto gap-2 rounded-xl bg-gradient-brand px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Apply to {plural(products.length)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
