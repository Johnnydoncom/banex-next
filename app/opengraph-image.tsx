import { brandOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og"

export const alt = "Banex Mall — Buy & Sell Anything in Nigeria"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

/** Site-wide default OG image (used by home and any page without its own). */
export default function DefaultOgImage() {
  return brandOgImage({
    eyebrow: "Nigeria's online mall",
    title: "Shop, delivered in an hour.",
    subtitle: "Order from 100+ vendors inside Banex Mall",
    badges: ["Escrow protected", "Same-hour delivery", "In-mall pickup"],
  })
}
