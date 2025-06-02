import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        authenticated: false, 
        redirectTo: "/login" 
      })
    }
    
    // Get user role from database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    let redirectTo = "/dashboard"
    
    if (userData?.role === 'recruiter') {
      redirectTo = '/recruiter'
    } else if (userData?.role === 'admin') {
      redirectTo = '/admin'
    } else if (userData?.role === 'sales-professional' || !userData?.role) {
      // Check if onboarded
      const onboarded = user.user_metadata?.onboarded
      redirectTo = onboarded ? '/dashboard' : '/onboarding'
    }
    
    return NextResponse.json({
      authenticated: true,
      role: userData?.role || 'sales-professional',
      redirectTo
    })
  } catch (error) {
    console.error("Navigation error:", error)
    return NextResponse.json({ 
      authenticated: false, 
      redirectTo: "/login",
      error: error instanceof Error ? error.message : "Unknown error"
    })
  }
} 