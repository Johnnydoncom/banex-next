import { ImageResponse } from "next/og"
import { SITE_NAME } from "./config"

/**
 * Shared 1200×630 OpenGraph image template for Banex Mall listings.
 *
 * Rendered by Next.js `opengraph-image.tsx` routes via Satori, so styling is
 * limited to flexbox + a subset of CSS. Colors use hex (Satori doesn't support
 * oklch). Brand palette mirrors globals.css: greens #A7CF38 / #7DC243 / #5B8B82.
 */

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = "image/png"

const BRAND = "#7DC243"
const BRAND_SOFT = "#A7CF38"
const BRAND_DEEP = "#5B8B82"
const INK = "#1f2a24"
const MUTED = "#5c6b62"

export type OgProps = {
  /** Small uppercase label above the title (e.g. category, "Verified vendor"). */
  eyebrow?: string
  title: string
  /** Secondary line — price, location, tagline. */
  subtitle?: string
  /** Optional right-hand image (product photo / vendor cover). */
  imageUrl?: string | null
  /** Small badges rendered under the subtitle (e.g. rating, "Escrow protected"). */
  badges?: string[]
  /** Bottom-right label; defaults to the site name. */
  brandLabel?: string
}

export function brandOgImage(props: OgProps): ImageResponse {
  const { eyebrow, title, subtitle, imageUrl, badges = [], brandLabel = SITE_NAME } = props

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
          backgroundImage: `radial-gradient(circle at 12% 0%, ${BRAND_SOFT}33, transparent 42%), radial-gradient(circle at 92% 8%, ${BRAND_DEEP}22, transparent 45%)`,
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Top brand bar */}
        <div style={{ display: "flex", height: 12, width: "100%" }}>
          <div style={{ flex: 1, background: BRAND_SOFT }} />
          <div style={{ flex: 1, background: BRAND }} />
          <div style={{ flex: 1, background: BRAND_DEEP }} />
        </div>

        <div style={{ display: "flex", flex: 1, padding: "56px 64px" }}>
          {/* Left: text */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: imageUrl ? 1.35 : 1,
              paddingRight: imageUrl ? 40 : 0,
            }}
          >
            {/* Logo lockup */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${BRAND_SOFT}, ${BRAND} 55%, ${BRAND_DEEP})`,
                  color: "#fff",
                  fontSize: 26,
                  fontWeight: 800,
                }}
              >
                B
              </div>
              <div
                style={{
                  marginLeft: 14,
                  fontSize: 24,
                  fontWeight: 700,
                  color: INK,
                  letterSpacing: -0.5,
                }}
              >
                {SITE_NAME}
              </div>
            </div>

            {eyebrow ? (
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  color: BRAND_DEEP,
                  marginBottom: 16,
                }}
              >
                {eyebrow}
              </div>
            ) : null}

            <div
              style={{
                fontSize: title.length > 42 ? 52 : 64,
                fontWeight: 800,
                lineHeight: 1.05,
                color: INK,
                letterSpacing: -1.5,
                display: "flex",
              }}
            >
              {title.length > 90 ? title.slice(0, 88) + "…" : title}
            </div>

            {subtitle ? (
              <div style={{ fontSize: 34, fontWeight: 700, color: BRAND_DEEP, marginTop: 22, display: "flex" }}>
                {subtitle}
              </div>
            ) : null}

            {badges.length ? (
              <div style={{ display: "flex", marginTop: 26, flexWrap: "wrap" }}>
                {badges.slice(0, 3).map((b, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      fontSize: 20,
                      fontWeight: 600,
                      color: INK,
                      background: "#f2f6ee",
                      border: `1px solid ${BRAND}55`,
                      borderRadius: 999,
                      padding: "8px 18px",
                      marginRight: 12,
                      marginTop: 8,
                    }}
                  >
                    {b}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Right: image panel */}
          {imageUrl ? (
            <div
              style={{
                display: "flex",
                flex: 1,
                borderRadius: 28,
                overflow: "hidden",
                border: `1px solid ${BRAND}44`,
                boxShadow: `0 24px 60px -24px ${BRAND}66`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt=""
                width={520}
                height={520}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ) : null}
        </div>

        {/* Footer strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 64px 44px",
          }}
        >
          <div style={{ display: "flex", fontSize: 22, color: MUTED, fontWeight: 500 }}>
            Same-hour rider delivery · Escrow protected · Nigeria
          </div>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: BRAND_DEEP }}>
            {brandLabel}
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE }
  )
}
