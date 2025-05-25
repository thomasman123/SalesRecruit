import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If no session and trying to access protected routes
  if (!session) {
    const isProtectedRoute =
      req.nextUrl.pathname.startsWith("/dashboard") ||
      req.nextUrl.pathname.startsWith("/recruiter") ||
      req.nextUrl.pathname.startsWith("/onboarding")

    if (isProtectedRoute) {
      const redirectUrl = new URL("/login", req.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // If session exists but trying to access wrong role routes
  if (session) {
    const { data: userDetails } = await supabase.from("users").select("role").eq("id", session.user.id).single()

    // Redirect recruiters trying to access sales professional routes
    if (userDetails?.role === "recruiter" && req.nextUrl.pathname.startsWith("/dashboard")) {
      const redirectUrl = new URL("/recruiter", req.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect sales professionals trying to access recruiter routes
    if (userDetails?.role === "sales-professional" && req.nextUrl.pathname.startsWith("/recruiter")) {
      const redirectUrl = new URL("/dashboard", req.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth/callback).*)"],
}
