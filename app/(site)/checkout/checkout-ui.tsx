"use client"

// Presentational pieces shared by the signed-in and the guest checkout.
import { Input } from "@/components/ui/input"

export function Field({
  label,
  className = "",
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      <Input
        {...props}
        aria-invalid={error ? true : undefined}
        className={`mt-1 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:border-brand ${
          error ? "border-rose-500" : "border-border"
        }`}
      />
      {error && <span className="mt-1 block text-[11px] font-medium text-rose-600">{error}</span>}
    </label>
  )
}

function PaystackLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M141.8 196.3h228.4v119.4H141.8z" fill="#0ba4db" />
      <path d="M141.8 77.2h228.4v107.5H141.8zM141.8 327.2h228.4v107.6H141.8z" fill="#0a2a4b" />
    </svg>
  )
}

export function PayOption({
  active,
  onClick,
  slug,
  icon: Icon,
  imageUrl,
  label,
  sub,
  disabled
}: {
  active: boolean
  onClick: () => void
  slug?: string
  icon: React.ComponentType<{ className?: string }>
  imageUrl?: string
  label: string
  sub?: string
  disabled?: boolean
}) {
  const isPaystack = slug === "paystack"
  const isWallet = slug === "wallet"

  return (
    <button type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 ${active
        ? isWallet
          ? "border-brand bg-brand-soft/10 ring-1 ring-brand/20 shadow-sm"
          : "border-[#0ba4db] bg-[#0ba4db]/5 ring-1 ring-[#0ba4db]/20 shadow-sm"
        : disabled
          ? "border-border bg-surface/50 opacity-50 cursor-not-allowed"
          : "border-border bg-card hover:border-brand/40 hover:bg-surface/30"
        }`}
    >
      {/* Icon */}
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border transition-colors ${active
        ? isWallet ? "border-brand/30 bg-brand/10 text-brand" : "border-[#0ba4db]/30 bg-[#0ba4db]/10 text-[#0ba4db]"
        : "border-border bg-background text-muted-foreground group-hover:text-foreground group-hover:border-border/80"
        }`}>
        {isPaystack ? (
          <PaystackLogo className="h-5 w-auto" />
        ) : imageUrl ? (
          <img src={imageUrl} alt={label} className="h-5 w-auto object-contain" />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </div>

      {/* Label and Sub */}
      <div className="flex-1 overflow-hidden">
        <span className={`block truncate font-display text-sm font-semibold ${active ? "text-foreground" : "text-foreground"}`}>
          {label}
        </span>
        {sub && !disabled && (
          <span className="mt-0.5 block truncate text-[11px] font-medium text-muted-foreground">
            {sub}
          </span>
        )}
        {disabled && (
          <span className="mt-0.5 block truncate text-[11px] font-bold text-rose-500">
            Insufficient funds
          </span>
        )}
      </div>

      {/* Radio indicator */}
      <div className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border transition-all ${active
        ? isWallet ? "border-brand bg-brand text-white" : "border-[#0ba4db] bg-[#0ba4db] text-white"
        : "border-muted-foreground/30"
        }`}>
        {active && (
          <div className="h-1.5 w-1.5 rounded-full bg-white" />
        )}
      </div>
    </button>
  )
}

export function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <dt>{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  )
}
