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

  try {
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
            response.cookies.set(name, "", { ...options, maxAge: 0 })
          },
        },
      },
    )

    // First try to get the session (less likely to throw errors)
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession()

    // Prefer the user that comes in the session object (avoids the extra network round-trip).
    let user = session?.user ?? null

    // Fallback: if session exists but user is somehow missing, call getUser()
    if (!user && session && !sessionError) {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

        if (!authError) {
          user = authUser
        } else {
          console.error("Middleware auth error:", authError)
          if (authError.message === "Auth session missing!" && session) {
            const { data: { session: refreshedSession } } = await supabase.auth.refreshSession()
            if (refreshedSession) {
              user = refreshedSession.user
            }
          }
        }
      } catch (err) {
        console.error("middleware getUser() failure", err)
      }
    }

    // Auth-guard and role routing rules ----------------------------------
    const pathname = request.nextUrl.pathname
    const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/recruiter") || pathname.startsWith("/onboarding") || pathname.startsWith("/messages") || pathname.startsWith("/admin")
    const isAuthPage = pathname === "/login" || pathname === "/signup"
    const isAuthCallback = pathname.startsWith("/auth/callback")
    const isLandingPage = pathname === "/hire" || pathname === "/rep"
    const isTestPage = pathname === "/test-auth" || pathname.startsWith("/api/debug-auth")
    const isApiRoute = pathname.startsWith("/api/")
    const isRedirectPage = pathname === "/redirect"

    // Allow test pages, API routes, redirect page, and auth callback to proceed without redirection
    if (isAuthCallback || isTestPage || isApiRoute || isRedirectPage) {
      return response
    }

    // Allow landing pages to be accessible without authentication
    if (isLandingPage && !user) {
      return response
    }

    // If user is not logged in and trying to access protected route
    if (!user && isProtected) {
      const redirectUrl = new URL("/login", request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is logged in, get their role from the database
    let userRole: string | undefined
    let isOnboarded: boolean = false
    
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('role, onboarded')
        .eq('id', user.id)
        .single()
      
      userRole = userData?.role
      isOnboarded = userData?.onboarded || false

      // Debug logging
      console.log("Middleware - User ID:", user.id)
      console.log("Middleware - User Role:", userRole)
      console.log("Middleware - Onboarded:", isOnboarded)
      console.log("Middleware - Path:", pathname)
    }

    // If user is logged in and trying to access auth pages or landing pages
    if (user && (isAuthPage || isLandingPage)) {
      // If no role found, default to sales-professional
      if (!userRole) {
        console.warn("No role found for user, defaulting to sales-professional")
        userRole = "sales-professional"
      }
      
      const redirectPath = userRole === "recruiter" ? "/recruiter" : userRole === "admin" ? "/admin" : (isOnboarded ? "/dashboard" : "/onboarding")
      console.log("Redirecting to:", redirectPath)
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }

    if (user && userRole) {
      // Admin routing
      if (userRole === "admin") {
        // Admins can access everything, but have their own dashboard
        if (pathname === '/') {
          return NextResponse.redirect(new URL("/admin", request.url))
        }
        // Allow admins to access any page
        return response
      }

      // Restrict non-admins from accessing admin pages
      if (userRole !== "admin" && pathname.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }

      if (userRole === "recruiter" && pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/recruiter", request.url))
      }

      if (userRole === "sales-professional" && pathname.startsWith("/recruiter")) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }

      // Enforce onboarding for sales professionals
      if (userRole === "sales-professional") {
        // If not onboarded, force to onboarding page (except if already there)
        if (!isOnboarded && !pathname.startsWith("/onboarding") && !pathname.startsWith("/reset-password")) {
          console.log("User not onboarded, redirecting to /onboarding")
          return NextResponse.redirect(new URL("/onboarding", request.url))
        }

        // If onboarded and trying to access onboarding page again, redirect to dashboard
        if (isOnboarded && pathname.startsWith("/onboarding")) {
          return NextResponse.redirect(new URL("/dashboard", request.url))
        }
      }

      // Redirect based on role from root path
      if (pathname === '/') {
        const redirectPath = userRole === 'recruiter' ? '/recruiter' : userRole === 'admin' ? '/admin' : (isOnboarded ? '/dashboard' : '/onboarding')
        return NextResponse.redirect(new URL(redirectPath, request.url))
      }
    }

    // Handle Vercel Cron authentication
    if (request.nextUrl.pathname === '/api/calendar/refresh-tokens') {
      const authHeader = request.headers.get('authorization')
      
      // Vercel Cron sends a special header
      if (process.env.VERCEL) {
        const cronSecret = process.env.CRON_SECRET
        
        // Check for Vercel's cron authorization
        if (request.headers.get('x-vercel-cron-auth') === process.env.CRON_SECRET) {
          // Add the authorization header for our API
          const headers = new Headers(request.headers)
          headers.set('authorization', `Bearer ${cronSecret}`)
          
          return NextResponse.next({
            request: {
              headers,
            },
          })
        }
      }
    }

    return response
  } catch (error) {
    console.error("Middleware error:", error)
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}
