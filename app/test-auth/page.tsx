"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function TestAuthPage() {
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    setLoading(true)
    try {
      const supabase = getSupabaseClient()
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      // Get auth user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      // Get database user if authenticated
      let dbUser = null
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        dbUser = data
      }

      // Call debug API
      const response = await fetch('/api/debug-auth')
      const debugData = await response.json()

      setAuthStatus({
        session: session ? { 
          user_id: session.user.id,
          email: session.user.email,
          expires_at: session.expires_at
        } : null,
        sessionError: sessionError?.message,
        user: user ? {
          id: user.id,
          email: user.email,
          metadata: user.user_metadata,
          email_confirmed: user.email_confirmed_at
        } : null,
        userError: userError?.message,
        dbUser,
        debugApi: debugData
      })
    } catch (error) {
      setAuthStatus({ error: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const handleLogout = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const navigate = (path: string) => {
    window.location.href = path
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6">Authentication Test Page</h1>
        
        <Card className="p-6 bg-dark-800 border-dark-700">
          <h2 className="text-xl font-semibold text-white mb-4">Auth Status</h2>
          <pre className="text-sm text-gray-300 overflow-auto">
            {JSON.stringify(authStatus, null, 2)}
          </pre>
        </Card>

        <Card className="p-6 bg-dark-800 border-dark-700">
          <h2 className="text-xl font-semibold text-white mb-4">Actions</h2>
          <div className="space-x-4">
            <Button onClick={checkAuth}>Refresh Status</Button>
            <Button onClick={() => navigate("/login")} variant="outline">Go to Login</Button>
            <Button onClick={() => navigate("/dashboard")} variant="outline">Go to Dashboard</Button>
            <Button onClick={() => navigate("/recruiter")} variant="outline">Go to Recruiter</Button>
            <Button onClick={() => navigate("/onboarding")} variant="outline">Go to Onboarding</Button>
            <Button onClick={handleLogout} variant="destructive">Logout</Button>
          </div>
        </Card>

        <Card className="p-6 bg-dark-800 border-dark-700">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Diagnosis</h2>
          <div className="space-y-2 text-sm">
            <p className="text-gray-300">
              <span className="font-semibold">Authenticated:</span>{" "}
              <span className={authStatus?.user ? "text-green-500" : "text-red-500"}>
                {authStatus?.user ? "Yes" : "No"}
              </span>
            </p>
            {authStatus?.user && (
              <>
                <p className="text-gray-300">
                  <span className="font-semibold">Email:</span> {authStatus.user.email}
                </p>
                <p className="text-gray-300">
                  <span className="font-semibold">Email Confirmed:</span>{" "}
                  <span className={authStatus.user.email_confirmed ? "text-green-500" : "text-red-500"}>
                    {authStatus.user.email_confirmed ? "Yes" : "No"}
                  </span>
                </p>
                <p className="text-gray-300">
                  <span className="font-semibold">DB Role:</span>{" "}
                  <span className="text-purple-400">{authStatus.dbUser?.role || "Not found"}</span>
                </p>
                <p className="text-gray-300">
                  <span className="font-semibold">Expected Redirect:</span>{" "}
                  <span className="text-blue-400">
                    {authStatus.dbUser?.role === "recruiter" ? "/recruiter" : 
                     authStatus.dbUser?.role === "admin" ? "/admin" : "/dashboard"}
                  </span>
                </p>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
} 