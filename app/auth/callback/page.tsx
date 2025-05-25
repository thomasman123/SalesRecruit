"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = getSupabaseClient()

    // Helper to finish by redirecting home if something goes wrong
    const fallback = () => router.replace("/")

    // 1. Parse tokens from the hash (client-side only)
    const hashParams = new URLSearchParams(window.location.hash.slice(1))
    const access_token = hashParams.get("access_token") || searchParams.get("access_token")
    const refresh_token = hashParams.get("refresh_token") || searchParams.get("refresh_token")
    const type = hashParams.get("type") || searchParams.get("type")

    // Recovery / magic-link / invitation flows --------------------------------
    if (access_token && refresh_token) {
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(async ({ error }) => {
          if (error) return fallback()

          // Password-reset flow → send user to reset-password page
          if (type === "recovery") {
            router.replace(`/reset-password?access_token=${access_token}&refresh_token=${refresh_token}`)
            return
          }

          // All other flows → decide destination by role
          const { data: { user } } = await supabase.auth.getUser()
          const role = user?.user_metadata?.role as string | undefined
          router.replace(role === "recruiter" ? "/recruiter" : "/dashboard")
        })
        .catch(fallback)

      return // nothing else to do – we will redirect soon
    }

    // 2. OAuth / SSO code-exchange flow ---------------------------------------
    const code = searchParams.get("code")
    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ data, error }) => {
          if (error || !data.session) return fallback()

          const role = data.session.user.user_metadata?.role as string | undefined
          router.replace(role === "recruiter" ? "/recruiter" : "/dashboard")
        })
        .catch(fallback)
      return
    }

    // 3. Unknown flow → go home
    fallback()
  }, [router, searchParams])

  return (
    <div className="flex items-center justify-center min-h-screen text-white">
      Loading…
    </div>
  )
} 