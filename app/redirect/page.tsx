"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function RedirectPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        // First check client-side session
        const supabase = getSupabaseClient()
        
        // Wait a bit for session to sync
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Get session from client
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        console.log("Redirect page - Session check:", { 
          hasSession: !!session, 
          userId: session?.user?.id,
          email: session?.user?.email,
          error: sessionError 
        })

        if (!session) {
          console.log("No session found, redirecting to login")
          router.push('/login')
          return
        }

        // Get user role from database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()

        console.log("Redirect page - User data:", { userData, error: userError })

        if (userError || !userData) {
          setError("Failed to get user role")
          // Default to dashboard if we can't get role
          router.push('/dashboard')
          return
        }

        // Determine where to redirect based on role
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

        console.log("Redirect page - Final redirect to:", redirectTo)
        
        // Use router.push for client-side navigation
        router.push(redirectTo)
        
      } catch (error) {
        console.error("Redirect error:", error)
        setError(error instanceof Error ? error.message : "Unknown error")
        // Default to dashboard on error
        router.push('/dashboard')
      }
    }

    checkAndRedirect()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-white">Redirecting...</p>
        {error && (
          <p className="text-red-400 text-sm mt-2">Error: {error}</p>
        )}
      </div>
    </div>
  )
} 