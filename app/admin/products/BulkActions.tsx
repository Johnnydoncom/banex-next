"use client"

import {
  Check, Ban, Power, PowerOff, Trash2, SlidersHorizontal, X,
  CheckCircle2, AlertTriangle, type LucideIcon,
} from "lucide-react"
import type { AdminProduct, BulkProductAction, BulkProductOutcome } from "@/lib/admin-api"
import { Button } from "@/components/ui/button"

export type BulkKind = BulkProductAction | "update"

/** Which products an action applies to — shared by the row buttons and the bulk bar. */
export const BULK_RULES: Record<BulkProductAction, (p: AdminProduct) => boolean> = {
  approve: (p) => p.status === "pending",
  reject: (p) => p.status === "pending",
  activate: (p) => p.status === "inactive" || p.status === "rejected" || p.status === "draft",
  deactivate: (p) => p.status === "active",
  delete: () => true,
}

export const BULK_COPY: Record<BulkKind, { label: string; done: string; description: string; needs: string }> = {
  approve: {
    label: "Approve",
    done: "approved",
    description: "They will become visible to buyers on the marketplace.",
    needs: "Only pending products can be approved.",
  },
  reject: {
    label: "Reject",
    done: "rejected",
    description: "They will be marked as rejected and stay hidden from buyers.",
    needs: "Only pending products can be rejected.",
  },
  activate: {
    label: "Activate",
    done: "activated",
    description: "They will become visible and purchasable again.",
    needs: "Only inactive, rejected or draft products can be activated.",
  },
  deactivate: {
    label: "Deactivate",
    done: "deactivated",
    description: "Buyers won't be able to see or purchase them until they're reactivated.",
    needs: "Only active products can be deactivated.",
  },
  delete: {
    label: "Delete",
    done: "deleted",
    description: "They will be removed from the catalogue. Any product the server can't delete is reported back.",
    needs: "",
  },
  update: { label: "Edit", done: "updated", description: "", needs: "" },
}

export const plural = (n: number, word = "product") => `${n} ${word}${n === 1 ? "" : "s"}`

const STATUS_ACTIONS: { kind: BulkProductAction; icon: LucideIcon; tone: string }[] = [
  { kind: "approve", icon: Check, tone: "text-emerald-700 hover:bg-emerald-500/15" },
  { kind: "reject", icon: Ban, tone: "text-rose-700 hover:bg-rose-500/15" },
  { kind: "activate", icon: Power, tone: "text-emerald-700 hover:bg-emerald-500/15" },
  { kind: "deactivate", icon: PowerOff, tone: "text-amber-700 hover:bg-amber-500/15" },
]

// ─── Bulk action bar ──────────────────────────────────────────────────────────

export function BulkActionBar({
  selected,
  onAction,
  onEdit,
  onClear,
}: {
  selected: AdminProduct[]
  onAction: (kind: BulkProductAction) => void
  onEdit: () => void
  onClear: () => void
}) {
  if (selected.length === 0) return null

  const btn = "h-auto gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold disabled:opacity-40"

  return (
    <div className="sticky bottom-4 z-20" role="region" aria-label="Bulk actions">
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2 rounded-2xl border border-border bg-card/95 px-3 py-2.5 shadow-2xl backdrop-blur">
        <span className="flex items-center gap-2 pr-1 text-xs font-semibold">
          <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold tabular-nums text-primary-foreground">
            {selected.length}
          </span>
          selected
        </span>
        <Button
          type="button"
          variant="ghost"
          onClick={onClear}
          className="h-auto gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" /> Clear
        </Button>

        <span className="mx-1 hidden h-5 w-px bg-border sm:block" />

        {STATUS_ACTIONS.map(({ kind, icon: Icon, tone }) => {
          const eligible = selected.filter(BULK_RULES[kind]).length
          return (
            <Button
              key={kind}
              type="button"
              variant="ghost"
              disabled={eligible === 0}
              onClick={() => onAction(kind)}
              title={eligible === 0 ? BULK_COPY[kind].needs : `${BULK_COPY[kind].label} ${plural(eligible)}`}
              className={`${btn} ${tone}`}
            >
              <Icon className="h-3.5 w-3.5" /> {BULK_COPY[kind].label}
              {/* Show the count only when it isn't simply "everything selected". */}
              {eligible > 0 && eligible < selected.length && (
                <span className="rounded-full bg-current/10 px-1.5 text-[10px] font-bold tabular-nums">{eligible}</span>
              )}
            </Button>
          )
        })}

        <span className="mx-1 hidden h-5 w-px bg-border sm:block" />

        <Button type="button" variant="ghost" onClick={onEdit} className={`${btn} hover:bg-surface hover:text-brand`}>
          <SlidersHorizontal className="h-3.5 w-3.5" /> Edit
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onAction("delete")}
          className={`${btn} text-rose-700 hover:bg-rose-500/15`}
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </div>
    </div>
  )
}

// ─── Result dialog (shown when some or all products failed) ───────────────────

export type BulkResult = {
  kind: BulkKind
  outcome: BulkProductOutcome
  /** Product names captured before the action (deleted products vanish from the list). */
  names: Record<string, string>
}

export function BulkResultDialog({ result, onClose }: { result: BulkResult | null; onClose: () => void }) {
  if (!result) return null
  const { kind, outcome, names } = result
  const failures = outcome.results.filter((r) => !r.success)
  const nothingWorked = outcome.succeeded === 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="bulk-result-title" className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${nothingWorked ? "bg-rose-500/15" : "bg-amber-500/15"}`}>
            <AlertTriangle className={`h-5 w-5 ${nothingWorked ? "text-rose-600" : "text-amber-600"}`} />
          </div>
          <div>
            <h3 id="bulk-result-title" className="font-display text-base font-bold">
              {nothingWorked ? `No products were ${BULK_COPY[kind].done}` : `Only some products were ${BULK_COPY[kind].done}`}
            </h3>
            <p className="text-xs text-muted-foreground">
              {outcome.succeeded} of {plural(outcome.results.length)} {BULK_COPY[kind].done}.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-emerald-500/10 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> Succeeded
            </p>
            <p className="mt-0.5 font-display text-xl font-bold tabular-nums text-emerald-700">{outcome.succeeded}</p>
          </div>
          <div className="rounded-xl bg-rose-500/10 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-700">
              <Ban className="h-3.5 w-3.5" /> Failed
            </p>
            <p className="mt-0.5 font-display text-xl font-bold tabular-nums text-rose-700">{outcome.failed}</p>
          </div>
        </div>

        <ul className="mt-4 max-h-56 divide-y divide-border/60 overflow-y-auto rounded-xl border border-border">
          {failures.map((r) => (
            <li key={r.id} className="px-3 py-2">
              <p className="truncate text-sm font-medium">{names[r.id] ?? r.id}</p>
              <p className="text-[11px] text-rose-700">{r.error}</p>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-[11px] text-muted-foreground">
          The products that failed are still selected, so you can adjust and try again.
        </p>

        <div className="mt-5 flex justify-end">
          <Button type="button" onClick={onClose} className="h-auto rounded-xl bg-gradient-brand px-5 py-2 text-xs font-semibold text-primary-foreground">
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
