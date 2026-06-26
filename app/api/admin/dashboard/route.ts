import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api-marketplace.banexmall.com/api"

/**
 * Proxied admin dashboard data endpoint.
 *
 * Fetches categories, sellers, and products from the Laravel backend
 * server-side to avoid CORS issues. The client sends the Bearer token
 * in the Authorization header; we forward it to the backend.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")

  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    )
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: authHeader,
  }

  try {
    const [categoriesRes, sellersRes, productsRes] = await Promise.all([
      fetch(`${API_URL}/admin/categories`, { headers }),
      fetch(`${API_URL}/admin/sellers`, { headers }),
      fetch(`${API_URL}/admin/products`, { headers }),
    ])

    // Check for auth failures
    if (categoriesRes.status === 401 || sellersRes.status === 401 || productsRes.status === 401) {
      return NextResponse.json(
        { success: false, message: "Authentication failed. Please sign in again." },
        { status: 401 },
      )
    }

    const [categoriesData, sellersData, productsData] = await Promise.all([
      categoriesRes.json(),
      sellersRes.json(),
      productsRes.json(),
    ])

    return NextResponse.json({
      success: true,
      data: {
        categories: categoriesData?.data ?? null,
        sellers: sellersData?.data ?? null,
        products: productsData?.data ?? null,
      },
    })
  } catch (error: any) {
    console.error("[api/admin/dashboard] Proxy error:", error)
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch dashboard data" },
      { status: 502 },
    )
  }
}
