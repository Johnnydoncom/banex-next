import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api-marketplace.banexmall.com/api"

// This proxy serves authenticated, per-user data (wishlist, cart, orders, wallet…).
// It must never be cached — always run dynamically and hit the backend fresh.
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

/**
 * Universal API Proxy
 *
 * Catches all requests to /api/proxy/* and forwards them to the Laravel backend.
 * This completely bypasses CORS for client-side API requests.
 */
async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const joinedPath = path.join("/")
  const authHeader = req.headers.get("Authorization")
  const searchParams = req.nextUrl.searchParams.toString()
  
  const targetUrl = `${API_URL}/${joinedPath}${searchParams ? `?${searchParams}` : ""}`

  const headers = new Headers()
  headers.set("Accept", "application/json")
  
  // Extract NextAuth token from HttpOnly cookies securely
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (token?.accessToken) {
    headers.set("Authorization", `Bearer ${token.accessToken}`)
  } else if (authHeader) {
    headers.set("Authorization", authHeader)
  }
  
  // Forward Content-Type if it exists
  const contentType = req.headers.get("Content-Type")
  if (contentType) {
    headers.set("Content-Type", contentType)
  }

  try {
    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
      // Bypass Next.js' data cache — this is live per-user data, never stale.
      cache: "no-store",
    }

    // Only attach body for methods that support it
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      const body = await req.arrayBuffer()
      if (body.byteLength > 0) {
        fetchOptions.body = body
      }
    }

    const response = await fetch(targetUrl, fetchOptions)

    const upstreamType = response.headers.get("content-type") || ""

    // Non-JSON responses (file downloads: payment proofs, receipts, images/PDFs)
    // must be streamed through byte-for-byte — JSON-parsing them corrupts binary.
    if (!upstreamType.includes("application/json") && !upstreamType.includes("text/")) {
      const buffer = await response.arrayBuffer()
      const passHeaders = new Headers()
      passHeaders.set("Content-Type", upstreamType || "application/octet-stream")
      const disposition = response.headers.get("content-disposition")
      if (disposition) passHeaders.set("Content-Disposition", disposition)
      passHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate")
      return new NextResponse(buffer, { status: response.status, headers: passHeaders })
    }

    // We get the content as text so we can parse it to JSON safely
    const textData = await response.text()
    let data = null
    try {
      data = textData ? JSON.parse(textData) : null
    } catch {
      data = textData // fallback to text if not JSON
    }

    // Pass through the exact status from the backend, and tell the browser never
    // to cache this authenticated response (prevents stale wishlist/cart/etc.).
    return NextResponse.json(data, {
      status: response.status,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    })
  } catch (error: any) {
    console.error(`[api/proxy] Error forwarding to ${targetUrl}:`, error)
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Proxy Error" },
      { status: 502 }
    )
  }
}

export const GET = handleProxy
export const POST = handleProxy
export const PUT = handleProxy
export const PATCH = handleProxy
export const DELETE = handleProxy
