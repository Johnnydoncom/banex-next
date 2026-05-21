"use client"

import Link from "next/link"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useCart } from "@/components/CartContext"
import { formatNaira } from "@/lib/products"
import { Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react"

export function CartSheet() {
  const { isOpen, setOpen, items, setQty, remove, subtotal, count, close } = useCart()

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="flex items-center gap-2 font-display">
            <ShoppingBag className="h-4 w-4 text-brand" /> Your cart
            <span className="ml-1 rounded-full bg-brand-soft/30 px-2 py-0.5 text-xs font-medium text-brand-deep">
              {count}
            </span>
          </SheetTitle>
          <SheetDescription className="text-xs">
            All purchases are protected by our escrow service.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft/30">
                <ShoppingBag className="h-6 w-6 text-brand-deep" />
              </div>
              <p className="mt-4 font-display text-lg font-semibold">Your cart is empty</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Browse the marketplace and add items from any verified seller.
              </p>
              <Link
                href="/shop"
                onClick={close}
                className="mt-5 rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((it) => (
                <li key={it.id} className="flex gap-3 rounded-xl border border-border bg-card p-3">
                  <img src={it.productImage} alt={it.productName} className="h-20 w-20 rounded-lg object-cover" />
                  <div className="flex flex-1 flex-col">
                    <p className="line-clamp-1 text-sm font-semibold">{it.productName}</p>
                    <p className="text-[11px] text-muted-foreground">Sold by {it.sellerName}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-border">
                        <button
                          aria-label="Decrease"
                          onClick={() => setQty(it.id, it.qty - 1)}
                          className="px-2 py-1 text-muted-foreground hover:text-foreground"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-6 text-center text-xs font-semibold">{it.qty}</span>
                        <button
                          aria-label="Increase"
                          onClick={() => setQty(it.id, it.qty + 1)}
                          className="px-2 py-1 text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="font-display text-sm font-bold">{formatNaira(it.qty * it.price)}</p>
                    </div>
                  </div>
                  <button
                    aria-label="Remove"
                    onClick={() => remove(it.id)}
                    className="self-start text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border bg-card/60 px-5 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-display text-xl font-bold">{formatNaira(subtotal)}</span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-brand" /> Escrow holds your payment until you confirm delivery.
            </p>
            <Link
              href="/checkout"
              onClick={close}
              className="mt-3 flex w-full items-center justify-center rounded-full bg-gradient-brand py-3 text-sm font-semibold text-primary-foreground"
            >
              Proceed to escrow checkout
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
