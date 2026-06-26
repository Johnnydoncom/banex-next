"use client"

const tones: Record<string, string> = {
  // Positive
  active: "bg-emerald-500/15 text-emerald-700",
  approved: "bg-emerald-500/15 text-emerald-700",
  delivered: "bg-emerald-500/15 text-emerald-700",
  verified: "bg-emerald-500/15 text-emerald-700",
  completed: "bg-emerald-500/15 text-emerald-700",

  // Progress
  pending: "bg-amber-500/15 text-amber-700",
  processing: "bg-amber-500/15 text-amber-700",
  "under review": "bg-amber-500/15 text-amber-700",
  "in review": "bg-amber-500/15 text-amber-700",

  // Info
  shipped: "bg-blue-500/15 text-blue-700",
  confirmed: "bg-brand-soft/40 text-brand-deep",

  // Negative
  rejected: "bg-rose-500/15 text-rose-700",
  cancelled: "bg-rose-500/15 text-rose-700",
  suspended: "bg-rose-500/15 text-rose-700",
  inactive: "bg-zinc-500/15 text-zinc-600",
  deactivated: "bg-zinc-500/15 text-zinc-600",
}

export function StatusBadge({ status, className = "" }: { status: string; className?: string }) {
  const normalized = status.toLowerCase()
  const tone = tones[normalized] ?? "bg-zinc-500/15 text-zinc-600"

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${tone} ${className}`}
    >
      {status}
    </span>
  )
}
