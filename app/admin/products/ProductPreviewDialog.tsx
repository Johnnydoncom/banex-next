"use client"

import { useEffect } from "react"
import { createPortal } from "react-dom"
import { ArrowLeft, Eye, Info } from "lucide-react"
import type { GenericProduct, ProductVariant } from "@/lib/generic-api"
import type { AttrKey, VariantRow } from "@/components/VariantsEditor"
import { ProductDetailView } from "@/app/(site)/product/[slug]/components/ProductDetailView"
import { Button } from "@/components/ui/button"

export type ProductPreview = {
  product: GenericProduct
  /** What the form still lacks — shown as a hint above the preview. */
  missing: string[]
}

type PreviewInput = {
  name: string
  brand: string
  description: string
  regular_price: string
  sales_price: string
  stock_quantity: string
  location: string
  delivery_estimate: string
  is_featured: boolean
  is_nationwide_delivery: boolean
  is_authentic_only: boolean
  hasVariants: boolean
  variantRows: VariantRow[]
  variantAttrs: AttrKey[]
  specifications: { key: string; value: string }[]
  /** Images in display order — object URLs for files that aren't uploaded yet. */
  images: { url: string; is_primary: boolean }[]
  category?: { id: string; name: string; slug: string } | null
  seller?: { id: string; shop_name: string; slug: string } | null
  /** The seller's assigned WhatsApp number, if any (drives the contact buttons). */
  whatsapp?: string | null
}

const positive = (v: string) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}

// Same rule as the backend: a sale only applies when 0 < sale < regular, and
// `price` is always the effective price.
function pricing(regularRaw: string, salesRaw: string) {
  const regular = positive(regularRaw)
  const sales = positive(salesRaw)
  const onSale = sales > 0 && sales < regular
  return { price: onSale ? sales : regular, regular_price: regular, sales_price: onSale ? sales : null }
}

/** Shape the (unsaved) product form into the storefront's product object. */
export function buildProductPreview(input: PreviewInput): ProductPreview {
  const variants: ProductVariant[] = input.hasVariants
    ? input.variantRows
        .map((row, i) => {
          const attributes: Record<string, string> = {}
          for (const key of input.variantAttrs) {
            if (row[key].trim()) attributes[key] = row[key].trim()
          }
          const stock = Math.floor(positive(row.stock))
          return {
            id: `preview-variant-${i}`,
            sku: null,
            attributes,
            ...pricing(row.regular_price, row.sales_price),
            stock_quantity: stock,
            in_stock: stock > 0,
            is_default: row.is_default,
            sort_order: i + 1,
          }
        })
        // A row with no colour/size yet can't be offered as a choice.
        .filter((v) => Object.keys(v.attributes).length > 0)
    : []

  const hasVariants = variants.length > 0
  const base = hasVariants
    ? (variants.find((v) => v.is_default) ?? variants[0])
    : pricing(input.regular_price, input.sales_price)
  const inStock = hasVariants ? variants.some((v) => v.in_stock) : positive(input.stock_quantity) > 0

  const hasPrimary = input.images.some((img) => img.is_primary)
  const images = input.images.map((img, i) => ({
    url: img.url,
    sort_order: i + 1,
    is_primary: hasPrimary ? img.is_primary : i === 0,
  }))

  const description = input.description.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() ? input.description : null

  const missing: string[] = []
  if (!input.name.trim()) missing.push("a name")
  if (images.length === 0) missing.push("images")
  if (!(Number(base.price) > 0)) missing.push("a price")
  if (!input.category) missing.push("a category")
  if (!description) missing.push("a description")

  return {
    missing,
    product: {
      id: "preview",
      slug: "preview",
      name: input.name.trim() || "Untitled product",
      brand: input.brand.trim() || null,
      price: Number(base.price),
      regular_price: base.regular_price,
      sales_price: base.sales_price,
      currency: "NGN",
      location: input.location || null,
      in_stock: inStock,
      has_variants: hasVariants,
      variants,
      rating_average: null,
      reviews_count: 0,
      is_featured: input.is_featured,
      is_nationwide_delivery: input.is_nationwide_delivery,
      is_authentic_only: input.is_authentic_only,
      images,
      seller: input.seller
        ? { id: input.seller.id, shop_name: input.seller.shop_name, slug: input.seller.slug, whatsapp: input.whatsapp ?? null }
        : null,
      category: input.category
        ? { id: input.category.id, name: input.category.name, slug: input.category.slug, image_url: null }
        : null,
      description,
      specifications: input.specifications
        .filter((s) => s.key.trim() && s.value.trim())
        .map((s) => `${s.key.trim()} => ${s.value.trim()}`),
      delivery_estimate: input.delivery_estimate || null,
    },
  }
}

/**
 * Full-screen "as a shopper sees it" preview of an unsaved product. It renders the
 * storefront's own product view, in preview mode so nothing is bought or saved.
 */
export function ProductPreviewDialog({ preview, onClose }: { preview: ProductPreview; onClose: () => void }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      // The image lightbox opens on top of the preview and handles its own Escape.
      if (e.key === "Escape" && !document.querySelector('[aria-label="Image viewer"]')) onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  const { product, missing } = preview

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Customer preview" className="fixed inset-0 z-[60] flex flex-col bg-background">
      {/* The way back sits on the left — toasts appear top-right and would cover it. */}
      <header className="flex flex-none items-center gap-3 border-b border-border bg-card px-4 py-3 md:px-8">
        <Button
          type="button"
          variant="outline"
          autoFocus
          onClick={onClose}
          className="h-auto flex-none gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Back to editing</span>
          <span className="sm:hidden">Back</span>
        </Button>
        <div className="min-w-0 border-l border-border pl-3">
          <p className="flex items-center gap-1.5 font-display text-sm font-bold">
            <Eye className="h-4 w-4 flex-none text-brand" /> Customer preview
          </p>
          <p className="truncate text-xs text-muted-foreground">
            How shoppers will see this product once it&apos;s live — nothing here is saved or purchasable.
          </p>
        </div>
      </header>

      {missing.length > 0 && (
        <p className="flex flex-none items-center gap-2 border-b border-amber-300/60 bg-amber-50 px-4 py-2 text-xs text-amber-800 md:px-8 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <Info className="h-3.5 w-3.5 flex-none" />
          <span>This product doesn&apos;t have {listOf(missing)} yet — the preview will fill in as you add them.</span>
        </p>
      )}

      <div className="flex-1 overflow-y-auto">
        <ProductDetailView product={product} preview />
      </div>
    </div>,
    document.body,
  )
}

// "a name", "images" → "a name or images"; three or more get commas.
function listOf(items: string[]) {
  if (items.length <= 1) return items[0] ?? ""
  return `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`
}
