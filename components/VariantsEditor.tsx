"use client"

import { Plus, Trash2, Palette, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { type ProductVariant, variantAttributes } from "@/lib/generic-api"

// Only `color` and `size` attributes are supported by the backend.
export type AttrKey = "color" | "size"
export const ALL_ATTRS: { key: AttrKey; label: string; placeholder: string }[] = [
  { key: "color", label: "Colour", placeholder: "e.g. Red" },
  { key: "size", label: "Size", placeholder: "e.g. M" },
]

export type VariantRow = {
  color: string
  size: string
  /** Regular (list) price — required. */
  regular_price: string
  /** Optional sale price; must be strictly less than regular_price. Empty/0 = no sale. */
  sales_price: string
  stock: string
  is_default: boolean
}

export function emptyVariantRow(is_default = false): VariantRow {
  return { color: "", size: "", regular_price: "", sales_price: "", stock: "", is_default }
}

/** Which attributes are actually in use across a product's existing variants. */
export function inferAttrs(variants: ProductVariant[] | undefined | null): AttrKey[] {
  const used: AttrKey[] = []
  for (const v of variants ?? []) {
    const a = variantAttributes(v.attributes)
    if (a.color && !used.includes("color")) used.push("color")
    if (a.size && !used.includes("size")) used.push("size")
  }
  // Default to colour when a product has variants but no recognised attributes.
  return used.length ? used : ["color"]
}

/** Build editor rows from an existing product's variants (edit flow). */
export function variantsFromProduct(variants: ProductVariant[] | undefined | null): VariantRow[] {
  if (!variants || variants.length === 0) return [emptyVariantRow(true)]
  return variants.map((v) => {
    const a = variantAttributes(v.attributes)
    // `regular_price` is the list price; fall back to `price` for older payloads
    // that predate the sale-pricing fields. `sales_price` populates only when set.
    const regular = v.regular_price != null ? v.regular_price : v.price
    return {
      color: a.color ?? "",
      size: a.size ?? "",
      regular_price: regular != null ? String(regular) : "",
      sales_price: v.sales_price != null && Number(v.sales_price) > 0 ? String(v.sales_price) : "",
      stock: v.stock_quantity != null ? String(v.stock_quantity) : "",
      is_default: !!v.is_default,
    }
  })
}

/** Validate rows against the active attributes; returns an error message or null. */
export function validateVariants(rows: VariantRow[], attrs: AttrKey[]): string | null {
  if (attrs.length === 0) return "Choose at least one attribute (colour or size)."
  if (rows.length === 0) return "Add at least one variant."
  for (const [i, r] of rows.entries()) {
    for (const key of attrs) {
      if (!r[key].trim()) return `Variant ${i + 1}: enter a ${key === "color" ? "colour" : "size"}.`
    }
    if (!r.regular_price || Number(r.regular_price) <= 0) return `Variant ${i + 1}: enter a valid regular price.`
    if (r.sales_price.trim() !== "" && Number(r.sales_price) > 0 && Number(r.sales_price) >= Number(r.regular_price)) {
      return `Variant ${i + 1}: sale price must be less than the regular price.`
    }
    if (r.stock === "" || Number(r.stock) < 0) return `Variant ${i + 1}: enter a valid stock quantity.`
  }
  // Detect duplicate combinations of the active attributes only.
  const seen = new Set<string>()
  for (const [i, r] of rows.entries()) {
    const key = attrs.map((k) => r[k].trim().toLowerCase()).join("|")
    if (seen.has(key)) return `Variant ${i + 1}: duplicate ${attrs.join(" / ")} combination.`
    seen.add(key)
  }
  if (!rows.some((r) => r.is_default)) return "Mark one variant as the default."
  return null
}

/** Append variant rows to a product FormData, only for the active attributes. */
export function appendVariants(fd: FormData, rows: VariantRow[], attrs: AttrKey[]) {
  rows.forEach((r, i) => {
    for (const key of attrs) {
      if (r[key].trim()) fd.append(`variants[${i}][attributes][${key}]`, r[key].trim())
    }
    fd.append(`variants[${i}][regular_price]`, r.regular_price)
    // Only send a sale price when one is actually set (0/blank clears it).
    if (r.sales_price.trim() !== "" && Number(r.sales_price) > 0) {
      fd.append(`variants[${i}][sales_price]`, r.sales_price)
    }
    fd.append(`variants[${i}][stock_quantity]`, r.stock)
    fd.append(`variants[${i}][is_default]`, r.is_default ? "1" : "0")
  })
}

export function VariantsEditor({
  enabled,
  onToggle,
  rows,
  onChange,
  attrs,
  onAttrsChange,
}: {
  enabled: boolean
  onToggle: (v: boolean) => void
  rows: VariantRow[]
  onChange: (rows: VariantRow[]) => void
  attrs: AttrKey[]
  onAttrsChange: (attrs: AttrKey[]) => void
}) {
  const setRow = (i: number, patch: Partial<VariantRow>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  const setDefault = (i: number) => onChange(rows.map((r, idx) => ({ ...r, is_default: idx === i })))

  const addRow = () => onChange([...rows, emptyVariantRow(rows.length === 0)])

  const removeRow = (i: number) => {
    const next = rows.filter((_, idx) => idx !== i)
    if (next.length && !next.some((r) => r.is_default)) next[0].is_default = true
    onChange(next)
  }

  const toggleAttr = (key: AttrKey) => {
    if (attrs.includes(key)) {
      if (attrs.length === 1) return // keep at least one attribute
      onAttrsChange(attrs.filter((a) => a !== key))
    } else {
      // Preserve canonical order (colour, size).
      onAttrsChange(ALL_ATTRS.map((a) => a.key).filter((k) => k === key || attrs.includes(k)))
    }
  }

  const activeCols = ALL_ATTRS.filter((a) => attrs.includes(a.key))
  // Columns: [attr…] + Regular + Sale + Stock + Default(auto) + Remove(auto).
  // Only two possible layouts (1 or 2 attribute columns) → static Tailwind classes.
  const gridCols =
    activeCols.length === 2
      ? "sm:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto_auto]"
      : "sm:grid-cols-[1fr_1fr_1fr_1fr_auto_auto]"

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
        <div className="mt-5 space-y-4">
          {/* Attribute chooser — only the picked attributes get a column below. */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Attributes for this product
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_ATTRS.map((a) => {
                const active = attrs.includes(a.key)
                return (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => toggleAttr(a.key)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? "border-brand bg-brand text-primary-foreground"
                        : "border-border bg-card hover:border-brand hover:text-brand"
                    }`}
                  >
                    {active && <Check className="h-3.5 w-3.5" />}
                    {a.label}
                  </button>
                )
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Choose only what applies — e.g. shoes may need Colour only, clothing Colour &amp; Size.
            </p>
          </div>

          {/* Column headers (desktop only) */}
          <div className={`hidden gap-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid sm:items-center ${gridCols}`}>
            {activeCols.map((a) => (
              <span key={a.key}>{a.label}</span>
            ))}
            <span>Regular (₦)</span>
            <span>Sale (₦)</span>
            <span>Stock</span>
            <span>Default</span>
            <span></span>
          </div>

          {rows.map((r, i) => (
            <div
              key={i}
              className={`grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface/40 p-3 sm:items-center sm:border-0 sm:bg-transparent sm:p-1 ${gridCols}`}
            >
              {activeCols.map((a) => (
                <div key={a.key} className="sm:contents">
                  <Label className="mb-1 block text-[10px] text-muted-foreground sm:hidden">{a.label}</Label>
                  <Input
                    value={r[a.key]}
                    onChange={(e) => setRow(i, { [a.key]: e.target.value } as Partial<VariantRow>)}
                    placeholder={a.placeholder}
                    className="rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              ))}
              <div className="sm:contents">
                <Label className="mb-1 block text-[10px] text-muted-foreground sm:hidden">Regular price</Label>
                <Input type="number" min="0" value={r.regular_price} onChange={(e) => setRow(i, { regular_price: e.target.value })} placeholder="10000" className="rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="sm:contents">
                <Label className="mb-1 block text-[10px] text-muted-foreground sm:hidden">Sale price (optional)</Label>
                <Input type="number" min="0" value={r.sales_price} onChange={(e) => setRow(i, { sales_price: e.target.value })} placeholder="—" className="rounded-lg px-3 py-2 text-sm" />
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
