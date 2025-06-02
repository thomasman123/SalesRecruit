"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function AuthCodeErrorPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // User is authenticated, redirect based on role
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()
        
        if (userData?.role === 'recruiter') {
          router.push('/recruiter')
        } else if (userData?.role === 'admin') {
          router.push('/admin')
        } else {
          const onboarded = session.user.user_metadata?.onboarded
          router.push(onboarded ? '/dashboard' : '/onboarding')
        }
      }
    }
    
    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="max-w-md w-full p-6 space-y-4">
        <div className="flex items-center space-x-2 text-amber-600">
          <AlertCircle className="h-6 w-6" />
          <h1 className="text-xl font-semibold">Authentication Issue</h1>
        </div>
        
        <div className="space-y-4 text-gray-600 dark:text-gray-400">
          <p>
            We encountered an issue during the authentication process. This can happen if:
          </p>
          
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>The verification link has expired</li>
            <li>You've already used this verification link</li>
            <li>There was a temporary connection issue</li>
          </ul>
          
          <p className="text-sm">
            If you've already verified your email, try logging in. Otherwise, you may need to request a new verification email.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            onClick={() => router.push('/login')}
            className="flex-1"
          >
            Go to Login
          </Button>
          
          <Button 
            onClick={() => router.push('/signup')}
            variant="outline"
            className="flex-1"
          >
            Sign Up Again
          </Button>
        </div>
      </Card>
    </div>
  )
} 