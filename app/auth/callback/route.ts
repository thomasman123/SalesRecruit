import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  // Log the callback parameters for debugging
  console.log("Auth callback received:", { 
    hasCode: !!code, 
    error, 
    errorDescription,
    next 
  })

  // Handle OAuth errors from Supabase
  if (error) {
    console.error("OAuth error:", error, errorDescription)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`)
  }

  if (code) {
    try {
      const supabase = await createServerSupabaseClient()
      const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (sessionError) {
        console.error("Session exchange error:", sessionError)
        return NextResponse.redirect(`${origin}/login?error=session_exchange_failed`)
      }

      // Get the user to determine their role
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error("Get user error:", userError)
        return NextResponse.redirect(`${origin}/login?error=user_fetch_failed`)
      }
      
      if (user) {
        // Get user role from database
        const { data: userData, error: dbError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (dbError) {
          console.error("Database error fetching user role:", dbError)
          // Don't fail, just use default role
        }
        
        // Determine redirect based on role
        let redirectTo = next
        if (userData?.role === 'recruiter') {
          redirectTo = '/recruiter'
        } else if (userData?.role === 'admin') {
          redirectTo = '/admin'
        } else {
          // For sales professionals, check if onboarded
          const onboarded = user.user_metadata?.onboarded
          redirectTo = onboarded ? '/dashboard' : '/onboarding'
        }
        
        console.log("Auth callback success - User:", user.email, "Role:", userData?.role, "Redirecting to:", redirectTo)
        
        return NextResponse.redirect(`${origin}${redirectTo}`)
      }
    } catch (error) {
      console.error("Auth callback error:", error)
      return NextResponse.redirect(`${origin}/login?error=callback_error`)
    }
  }

  // No code parameter provided
  console.error("Auth callback called without code parameter")
  return NextResponse.redirect(`${origin}/login?error=no_code`)
} 