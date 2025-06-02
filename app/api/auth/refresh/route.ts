import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Refresh the session
    const { data: { session }, error: sessionError } = await supabase.auth.refreshSession()
    
    if (sessionError || !session) {
      return NextResponse.json({
        success: false,
        error: sessionError?.message || "No session found"
      }, { status: 401 })
    }
    
    // Get user data from database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    if (dbError || !userData) {
      return NextResponse.json({
        success: false,
        error: "Failed to get user role"
      }, { status: 500 })
    }
    
    // Determine redirect based on role
    let redirectTo = '/dashboard'
    if (userData.role === 'recruiter') {
      redirectTo = '/recruiter'
    } else if (userData.role === 'admin') {
      redirectTo = '/admin'
    } else if (userData.role === 'sales-professional') {
      // Check if onboarded
      const onboarded = session.user.user_metadata?.onboarded
      redirectTo = onboarded ? '/dashboard' : '/onboarding'
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: userData.role
      },
      redirectTo
    })
  } catch (error) {
    console.error("Session refresh error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 