import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const PROTECTED_ROUTES = ["/checkout"]

/**
 * Next.js proxy (formerly "middleware") — request-time auth + role gating.
 *
 * Roles:
 *   admin    (type === "admin")               → /admin only
 *   vendor   (approved store: hasStore + storeStatus="approved") → /account + /vendor-dashboard
 *   customer (everyone else)                   → /account
 *
 * Enforced server-side so a signed-in user can never reach an area their role
 * doesn't own (the client-side layout guards are only UX).
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

  // Role gating.
  if (token && isDashboard) {
    const isAdmin = (token as { role?: string }).role === "admin"
    const hasStore = (token as { hasStore?: boolean }).hasStore === true
    const storeStatus = (token as { storeStatus?: string | null }).storeStatus
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
  matcher: ["/checkout", "/login", "/signup", "/admin/:path*", "/account/:path*", "/vendor-dashboard/:path*"],
}
