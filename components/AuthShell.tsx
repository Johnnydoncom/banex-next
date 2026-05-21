import Link from "next/link"
import type { ReactNode } from "react"

type Props = {
  eyebrow?: string
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthShell({ eyebrow, title, description, children, footer }: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{ background: "var(--gradient-radial-brand)" }}
      />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-5 py-8 md:py-12">
        <Link href="/" className="mb-8 inline-flex items-center gap-2">
          <img src="/assets/banex-mall-logo.png" alt="Banex Mall" className="h-10 w-auto" />
        </Link>
        <div className="rounded-2xl border border-border bg-card/95 p-6 shadow-soft backdrop-blur md:p-8">
          {eyebrow && (
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-brand-deep">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" /> {eyebrow}
            </span>
          )}
          <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight md:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        <p className="mt-auto pt-8 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Banex Mall · Lagos, Nigeria
        </p>
      </div>
    </div>
  )
}
