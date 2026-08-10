"use client"

import { Plus, Trash2, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { type ProductVariant, variantAttributes } from "@/lib/generic-api"

// Only `color` and `size` attributes are supported by the backend.
export type VariantRow = {
  color: string
  size: string
  price: string
  stock: string
  is_default: boolean
}

export function emptyVariantRow(is_default = false): VariantRow {
  return { color: "", size: "", price: "", stock: "", is_default }
}

/** Build editor rows from an existing product's variants (edit flow). */
export function variantsFromProduct(variants: ProductVariant[] | undefined | null): VariantRow[] {
  if (!variants || variants.length === 0) return [emptyVariantRow(true)]
  return variants.map((v) => {
    const a = variantAttributes(v.attributes)
    return {
      color: a.color ?? "",
      size: a.size ?? "",
      price: v.price != null ? String(v.price) : "",
      stock: v.stock_quantity != null ? String(v.stock_quantity) : "",
      is_default: !!v.is_default,
    }
  })
}

/** Validate rows; returns an error message or null. */
export function validateVariants(rows: VariantRow[]): string | null {
  if (rows.length === 0) return "Add at least one variant."
  for (const [i, r] of rows.entries()) {
    if (!r.color && !r.size) return `Variant ${i + 1}: set a colour and/or size.`
    if (!r.price || Number(r.price) <= 0) return `Variant ${i + 1}: enter a valid price.`
    if (r.stock === "" || Number(r.stock) < 0) return `Variant ${i + 1}: enter a valid stock quantity.`
  }
  // Detect duplicate color+size combos
  const seen = new Set<string>()
  for (const [i, r] of rows.entries()) {
    const key = `${r.color.toLowerCase()}|${r.size.toLowerCase()}`
    if (seen.has(key)) return `Variant ${i + 1}: duplicate colour/size combination.`
    seen.add(key)
  }
  if (!rows.some((r) => r.is_default)) return "Mark one variant as the default."
  return null
}

/** Append variant rows to a product FormData in the API's indexed shape. */
export function appendVariants(fd: FormData, rows: VariantRow[]) {
  rows.forEach((r, i) => {
    if (r.color.trim()) fd.append(`variants[${i}][attributes][color]`, r.color.trim())
    if (r.size.trim()) fd.append(`variants[${i}][attributes][size]`, r.size.trim())
    fd.append(`variants[${i}][price]`, r.price)
    fd.append(`variants[${i}][stock_quantity]`, r.stock)
    fd.append(`variants[${i}][is_default]`, r.is_default ? "1" : "0")
  })
}

export function VariantsEditor({
  enabled,
  onToggle,
  rows,
  onChange,
}: {
  enabled: boolean
  onToggle: (v: boolean) => void
  rows: VariantRow[]
  onChange: (rows: VariantRow[]) => void
}) {
  const setRow = (i: number, patch: Partial<VariantRow>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  const setDefault = (i: number) => onChange(rows.map((r, idx) => ({ ...r, is_default: idx === i })))

  const addRow = () => onChange([...rows, emptyVariantRow(rows.length === 0)])

  const removeRow = (i: number) => {
    const next = rows.filter((_, idx) => idx !== i)
    // Ensure a default still exists.
    if (next.length && !next.some((r) => r.is_default)) next[0].is_default = true
    onChange(next)
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <Palette className="h-5 w-5 text-brand" /> Variants
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Sell colour / size options, each with its own price &amp; stock. When off, the product uses a single
            price &amp; stock.
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} className="data-[state=checked]:bg-brand" />
      </div>

      {enabled && (
        <div className="mt-5 space-y-3">
          {/* Column headers (desktop) */}
          <div className="hidden gap-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-[1fr_1fr_1fr_1fr_auto_auto]">
            <span>Colour</span>
            <span>Size</span>
            <span>Price (₦)</span>
            <span>Stock</span>
            <span>Default</span>
            <span></span>
          </div>

          {rows.map((r, i) => (
            <div
              key={i}
              className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface/40 p-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto_auto] sm:items-center sm:border-0 sm:bg-transparent sm:p-1"
            >
              <div className="sm:contents">
                <Label className="mb-1 block text-[10px] text-muted-foreground sm:hidden">Colour</Label>
                <Input value={r.color} onChange={(e) => setRow(i, { color: e.target.value })} placeholder="e.g. Red" className="rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="sm:contents">
                <Label className="mb-1 block text-[10px] text-muted-foreground sm:hidden">Size</Label>
                <Input value={r.size} onChange={(e) => setRow(i, { size: e.target.value })} placeholder="e.g. M" className="rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="sm:contents">
                <Label className="mb-1 block text-[10px] text-muted-foreground sm:hidden">Price</Label>
                <Input type="number" min="0" value={r.price} onChange={(e) => setRow(i, { price: e.target.value })} placeholder="10000" className="rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="sm:contents">
                <Label className="mb-1 block text-[10px] text-muted-foreground sm:hidden">Stock</Label>
                <Input type="number" min="0" value={r.stock} onChange={(e) => setRow(i, { stock: e.target.value })} placeholder="10" className="rounded-lg px-3 py-2 text-sm" />
              </div>
              <label className="flex items-center gap-1.5 text-xs font-medium sm:justify-center">
                <input
                  type="radio"
                  name="variant-default"
                  checked={r.is_default}
                  onChange={() => setDefault(i)}
                  className="h-4 w-4 accent-brand"
                />
                <span className="sm:hidden">Default</span>
              </label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRow(i)}
                className="h-auto w-auto justify-self-end p-1.5 text-muted-foreground hover:text-rose-600"
                aria-label="Remove variant"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addRow}
            className="h-auto gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" /> Add variant
          </Button>
        </div>
      )}
    </section>
  )
}
