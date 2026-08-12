import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function DashboardRedirectPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Banex Mall is the single seller — there is no vendor dashboard. Admins go to
  // the admin console; everyone else to their customer account.
  const userRole = (session?.user as any)?.role
  redirect(userRole === "admin" ? "/admin" : "/account")
}
