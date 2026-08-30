"use client"

import { Check, AlertCircle, RotateCcw, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export type WizardStep = {
  key: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

export function WizardStepper({
  steps,
  current,
  furthest,
  onStepClick,
}: {
  steps: WizardStep[]
  current: number
  /** Furthest step reached/validated — steps up to here are clickable. */
  furthest: number
  onStepClick: (index: number) => void
}) {
  const pct = steps.length > 1 ? (current / (steps.length - 1)) * 100 : 0
  return (
    <div className="space-y-3">
      {/* Progress track */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-surface">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-brand transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Step circles + labels */}
      <div className="flex items-start justify-between gap-1">
        {steps.map((s, i) => {
          const state = i < current ? "done" : i === current ? "current" : "todo"
          const reachable = i <= furthest
          const Icon = s.icon
          return (
            <button
              key={s.key}
              type="button"
              disabled={!reachable}
              onClick={() => reachable && onStepClick(i)}
              aria-current={state === "current" ? "step" : undefined}
              className={`group flex min-w-0 flex-1 flex-col items-center gap-1.5 ${
                reachable ? "cursor-pointer" : "cursor-not-allowed"
              }`}
            >
              <span
                className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  state === "done"
                    ? "bg-gradient-brand text-primary-foreground shadow-brand"
                    : state === "current"
                      ? "border-2 border-brand bg-brand-soft/10 text-brand ring-4 ring-brand/10"
                      : "bg-surface text-muted-foreground"
                }`}
              >
                {state === "done" ? <Check className="h-4 w-4" /> : Icon ? <Icon className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={`hidden w-full truncate text-center text-[11px] font-semibold sm:block ${
                  state === "todo" ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                {s.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Compact label for small screens */}
      <p className="text-center text-xs font-semibold text-foreground sm:hidden">
        Step {current + 1} of {steps.length} · {steps[current]?.label}
      </p>
    </div>
  )
}

// ─── Footer nav ─────────────────────────────────────────────────────────────

export function WizardFooter({
  isFirst,
  isLast,
  submitting,
  onBack,
  onNext,
  onSubmit,
  onCancel,
  submitLabel = "Submit",
  nextLabel = "Continue",
}: {
  isFirst: boolean
  isLast: boolean
  submitting?: boolean
  onBack: () => void
  onNext: () => void
  onSubmit: () => void
  onCancel?: () => void
  submitLabel?: string
  nextLabel?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={isFirst && onCancel ? onCancel : onBack}
        disabled={submitting}
        className="h-auto rounded-xl px-5 py-2.5 text-xs font-semibold"
      >
        {isFirst ? (onCancel ? "Cancel" : "Back") : "Back"}
      </Button>
      {isLast ? (
        <Button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="h-auto rounded-xl bg-gradient-brand px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-brand disabled:opacity-60"
        >
          {submitting ? "Saving…" : submitLabel}
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onNext}
          className="h-auto rounded-xl bg-gradient-brand px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-brand"
        >
          {nextLabel}
        </Button>
      )}
    </div>
  )
}

// ─── Draft restored banner ────────────────────────────────────────────────────

export function DraftRestoredBanner({ savedAt, onDiscard }: { savedAt: number | null; onDiscard: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-2.5 text-xs dark:border-amber-500/30 dark:bg-amber-500/10">
      <span className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
        <RotateCcw className="h-3.5 w-3.5 flex-none" />
        <span>
          Draft restored{savedAt ? ` · saved ${timeAgo(savedAt)}` : ""}. Images aren&apos;t saved — re-add them before submitting.
        </span>
      </span>
      <button
        type="button"
        onClick={onDiscard}
        className="inline-flex flex-none items-center gap-1 font-semibold text-amber-800 hover:underline dark:text-amber-300"
      >
        <X className="h-3.5 w-3.5" /> Discard
      </button>
    </div>
  )
}

// ─── Inline field error ───────────────────────────────────────────────────────

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-rose-600">
      <AlertCircle className="h-3 w-3 flex-none" /> {message}
    </p>
  )
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const secs = Math.max(1, Math.round((Date.now() - ts) / 1000))
  if (secs < 60) return "just now"
  const mins = Math.round(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return `${days}d ago`
}
