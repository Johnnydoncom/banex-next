import type { Metadata } from "next"
import { Inter, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

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
  title: {
    default: "Banex Mall — Buy & Sell Anything in Nigeria",
    template: "%s — Banex Mall",
  },
  description:
    "Banex Mall is Nigeria's friendly online marketplace. Buy and sell vehicles, property, electronics, fashion, home goods and more from verified sellers.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Banex Mall — Buy & Sell Anything in Nigeria",
    description:
      "Vehicles, property, electronics, fashion, home & more from verified sellers across Nigeria.",
    type: "website",
    images: [
      {
        url: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6e796a94-0f0e-40ce-a53e-f76abf305e2e/id-preview-a3ba764a--166f733e-077c-41a6-8377-613ea87b5b0e.lovable.app-1776692435494.png",
        width: 1200,
        height: 630,
        alt: "Banex Mall",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Banex Mall — Buy & Sell Anything in Nigeria",
    description:
      "Vehicles, property, electronics, fashion, home & more from verified sellers across Nigeria.",
  },
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
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
