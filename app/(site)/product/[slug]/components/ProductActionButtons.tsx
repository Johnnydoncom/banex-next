"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingBag, Lock, Heart, Check } from "lucide-react"
import { useCart } from "@/components/CartContext"
import { useWishlist } from "@/components/WishlistContext"
import { toast } from "sonner"
import { type GenericProduct, type ProductVariant, variantAttributes } from "@/lib/generic-api"
import { formatNaira } from "@/lib/products"
import { Button } from "@/components/ui/button"

interface ProductActionButtonsProps {
  product: GenericProduct
}

const ATTR_ORDER = ["color", "size"] as const

// Distinct values for an attribute across the variants, preserving first-seen order.
function optionsFor(variants: ProductVariant[], key: string): string[] {
  const seen: string[] = []
  for (const v of variants) {
    const val = variantAttributes(v.attributes)[key]
    if (val && !seen.includes(val)) seen.push(val)
  }
  return seen
}

export function ProductActionButtons({ product }: ProductActionButtonsProps) {
  const router = useRouter()
  const { add, open } = useCart()
  const { isInWishlist, toggle } = useWishlist()

  const saved = isInWishlist(product.id)
  const variants = product.variants ?? []
  const hasVariants = !!product.has_variants && variants.length > 0

  // Which attribute dimensions are actually in use (color and/or size).
  const attrKeys = useMemo(
    () => ATTR_ORDER.filter((k) => variants.some((v) => variantAttributes(v.attributes)[k])),
    [variants],
  )

  const defaultVariant = variants.find((v) => v.is_default) ?? variants[0]
  const [selection, setSelection] = useState<Record<string, string>>(
    () => (hasVariants ? {} : variantAttributes(defaultVariant?.attributes)),
  )

  // The variant matching the current selection (every used attribute must match).
  const selectedVariant: ProductVariant | undefined = useMemo(() => {
    if (!hasVariants) return defaultVariant
    if (attrKeys.some((k) => !selection[k])) return undefined
    return variants.find((v) => {
      const a = variantAttributes(v.attributes)
      return attrKeys.every((k) => a[k] === selection[k])
    })
  }, [hasVariants, attrKeys, selection, variants, defaultVariant])

  // A value is selectable if some in-stock variant has it (given the other picks).
  const isAvailable = (key: string, value: string) =>
    variants.some((v) => {
      const a = variantAttributes(v.attributes)
      if (a[key] !== value) return false
      return attrKeys.every((k) => k === key || !selection[k] || a[k] === selection[k])
    })

  const primaryImg = product.images?.find((img) => img.is_primary)?.url || product.images?.[0]?.url || ""
  const sellerId = product.seller?.id || "unknown"
  const sellerName = product.seller?.shop_name || "Unknown Seller"

  const priceToShow = selectedVariant?.price ?? product.price
  const outOfStock = selectedVariant ? !selectedVariant.in_stock : !product.in_stock

  const buildLine = () => {
    if (hasVariants && !selectedVariant) {
      toast.error(`Please select ${attrKeys.join(" and ")}`)
      return null
    }
    if (outOfStock) {
      toast.error("This selection is out of stock")
      return null
    }
    return {
      id: `${product.id}-${selectedVariant?.id ?? sellerId}`,
      productId: product.id,
      productVariantId: selectedVariant?.id ?? null,
      variantAttributes: selectedVariant ? variantAttributes(selectedVariant.attributes) : null,
      productSlug: product.slug,
      productName: product.name,
      productImage: primaryImg,
      sellerId,
      sellerName,
      price: priceToShow,
    }
  }

  const addToCart = () => {
    const line = buildLine()
    if (!line) return
    add(line)
    open()
  }

  const buyNow = () => {
    const line = buildLine()
    if (!line) return
    add(line)
    router.push("/checkout")
  }

  return (
    <div className="mt-6">
      {/* Variant selectors */}
      {hasVariants && (
        <div className="mb-5 space-y-4">
          {attrKeys.map((key) => {
            const opts = optionsFor(variants, key)
            return (
              <div key={key}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {key}
                  {selection[key] && <span className="ml-2 normal-case text-foreground">{selection[key]}</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {opts.map((val) => {
                    const active = selection[key] === val
                    const available = isAvailable(key, val)
                    return (
                      <button
                        key={val}
                        type="button"
                        disabled={!available}
                        onClick={() => setSelection((s) => ({ ...s, [key]: val }))}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                          active
                            ? "border-brand bg-brand text-primary-foreground"
                            : available
                              ? "border-border bg-card hover:border-brand hover:text-brand"
                              : "border-border bg-surface text-muted-foreground/40 line-through"
                        }`}
                      >
                        {active && <Check className="h-3.5 w-3.5" />}
                        {val}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Selected variant price / stock */}
          <div className="flex items-center gap-3 text-sm">
            <span className="font-display text-2xl font-bold text-foreground">{formatNaira(priceToShow)}</span>
            {selectedVariant ? (
              selectedVariant.in_stock ? (
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                  In stock
                </span>
              ) : (
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600">
                  Out of stock
                </span>
              )
            ) : (
              <span className="text-xs text-muted-foreground">Select {attrKeys.join(" & ")} to see price</span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" type="button"
          onClick={buyNow}
          disabled={outOfStock || (hasVariants && !selectedVariant)}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          <Lock className="h-4 w-4" /> Buy with escrow
        </Button>
        <Button variant="ghost" type="button"
          onClick={addToCart}
          disabled={outOfStock || (hasVariants && !selectedVariant)}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:border-brand hover:text-brand disabled:opacity-50"
        >
          <ShoppingBag className="h-4 w-4" /> Add to cart
        </Button>
        <Button variant="ghost" type="button"
          onClick={() => toggle(product)}
          className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition-colors ${
            saved
              ? "border-brand bg-brand-soft/20 text-brand"
              : "border-border bg-card hover:border-brand hover:text-brand"
          }`}
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-brand" : ""}`} />
          {saved ? "Saved to wishlist" : "Save to wishlist"}
        </Button>
      </div>
    </div>
  )
}
