import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { Database } from "@/lib/supabase/database.types"

export async function middleware(request: NextRequest) {
  // Prepare a response that we can mutate cookies on
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create a Supabase client that syncs any refreshed cookies back to the browser
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set(name, value, options)
        },
        remove(name: string, options: any) {
          response.cookies.set(name, "", options)
        },
      },
    },
  )

  // Always attempt to refresh the session.
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Auth-guard and role routing rules ----------------------------------
  const pathname = request.nextUrl.pathname
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/recruiter") || pathname.startsWith("/onboarding")

  if (!session && isProtected) {
    const redirectUrl = new URL("/login", request.url)
    return NextResponse.redirect(redirectUrl)
  }

  if (session) {
    // Check the user's role from metadata (faster than extra DB query)
    const role = session.user.user_metadata?.role as string | undefined

    if (role === "recruiter" && pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/recruiter", request.url))
    }

    if (role === "sales-professional" && pathname.startsWith("/recruiter")) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth/callback).*)",
  ],
}
