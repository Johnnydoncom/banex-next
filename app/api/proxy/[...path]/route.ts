import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api-marketplace.banexmall.com/api"

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
  if (authHeader) {
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
    }

    // Only attach body for methods that support it
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      const body = await req.text()
      if (body) {
        fetchOptions.body = body
      }
    }

    const response = await fetch(targetUrl, fetchOptions)
    
    // We get the content as text so we can parse it to JSON safely
    const textData = await response.text()
    let data = null
    try {
      data = textData ? JSON.parse(textData) : null
    } catch {
      data = textData // fallback to text if not JSON
    }

    // Pass through the exact status from the backend
    return NextResponse.json(data, { status: response.status })
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
