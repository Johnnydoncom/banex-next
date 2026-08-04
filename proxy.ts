import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const PROTECTED_ROUTES = ["/checkout"]

/**
 * Next.js proxy (formerly "middleware") — request-time auth + role gating.
 *
 * Role-based dashboard access:
 *   admin    (type === "admin")                    → /admin only
 *   vendor   (type === "user" && approved store)   → /account + /vendor-dashboard
 *   customer (type === "user", no approved store)  → /account only
 *
 * Enforced server-side so a signed-in user can never reach a dashboard their role
 * doesn't own (the client-side layout guards are only UX). Relies on the JWT
 * carrying `role`, `hasStore` and `storeStatus` (set in lib/auth.ts).
 */
export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  const isDashboard =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/vendor-dashboard")
  const isProtected = isDashboard || PROTECTED_ROUTES.some((route) => pathname.startsWith(route))

  // Require sign-in for protected areas.
  if (isProtected && !token) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role gating for the three dashboards.
  if (token && isDashboard) {
    const role = (token as { role?: string }).role
    const hasStore = (token as { hasStore?: boolean }).hasStore === true
    const storeStatus = (token as { storeStatus?: string | null }).storeStatus
    const isAdmin = role === "admin"
    const isVendor = !isAdmin && hasStore && storeStatus === "approved"
    const redirect = (to: string) => NextResponse.redirect(new URL(to, req.url))

    if (pathname.startsWith("/admin")) {
      if (!isAdmin) return redirect("/account")
    } else if (pathname.startsWith("/vendor-dashboard")) {
      if (isAdmin) return redirect("/admin")
      if (!isVendor) return redirect("/account")
    } else if (pathname.startsWith("/account")) {
      // Admins are confined to the admin console.
      if (isAdmin) return redirect("/admin")
    }
  }

  // Redirect authenticated users away from auth pages, to their own dashboard.
  if (token && (pathname === "/login" || pathname === "/signup")) {
    const isAdmin = (token as { role?: string }).role === "admin"
    return NextResponse.redirect(new URL(isAdmin ? "/admin" : "/account", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/checkout",
    "/login",
    "/signup",
    "/admin/:path*",
    "/account/:path*",
    "/vendor-dashboard/:path*",
  ],
}
