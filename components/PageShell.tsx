import type { ReactNode } from "react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

type Props = {
  eyebrow?: string
  title: string
  description?: string
  children: ReactNode
}

export function PageShell({ eyebrow, title, description, children }: Props) {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "var(--gradient-radial-brand)" }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-14 md:px-8 md:py-20">
          {eyebrow && (
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-brand-deep">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" /> {eyebrow}
            </span>
          )}
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </section>
      <main className="mx-auto max-w-5xl px-4 py-12 md:px-8 md:py-16">{children}</main>
    </div>
  )
}
