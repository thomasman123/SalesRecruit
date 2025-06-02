import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Get the user to determine their role
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Get user role from database
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
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
        
        console.log("Auth callback - User role:", userData?.role, "Redirecting to:", redirectTo)
        
        return NextResponse.redirect(`${origin}${redirectTo}`)
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
} 