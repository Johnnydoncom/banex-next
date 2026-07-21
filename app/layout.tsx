import type { Metadata } from "next"
import { Inter, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { JsonLd } from "@/lib/seo/JsonLd"
import { organizationSchema, websiteSchema } from "@/lib/seo/jsonld"
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_DESCRIPTION,
  SITE_LOCALE,
  TWITTER_HANDLE,
} from "@/lib/seo/config"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    // Image comes from app/opengraph-image.tsx (branded, generated).
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    type: "website",
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    site: TWITTER_HANDLE,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
}

export const viewport = {
  themeColor: "#7DC243",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${plusJakartaSans.variable}`}
    >
      <head>
        <meta name="apple-mobile-web-app-title" content="Banex Marketplace" />
      </head>

      <body className="antialiased">
        <JsonLd schema={[organizationSchema(), websiteSchema()]} />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
