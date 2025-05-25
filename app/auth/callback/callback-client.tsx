"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"

export default function CallbackClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = getSupabaseClient()
    const fallback = () => router.replace("/")

    const hashParams = new URLSearchParams(window.location.hash.slice(1))
    const access_token = hashParams.get("access_token") || searchParams.get("access_token")
    const refresh_token = hashParams.get("refresh_token") || searchParams.get("refresh_token")
    const type = hashParams.get("type") || searchParams.get("type")

    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token }).then(async ({ error }) => {
        if (error) return fallback()

        if (type === "recovery") {
          router.replace(`/reset-password?access_token=${access_token}&refresh_token=${refresh_token}`)
          return
        }

        const { data: { user } } = await supabase.auth.getUser()
        const role = user?.user_metadata?.role as string | undefined
        router.replace(role === "recruiter" ? "/recruiter" : "/dashboard")
      }).catch(fallback)
      return
    }

    const code = searchParams.get("code")
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error || !data.session) return fallback()
        const role = data.session.user.user_metadata?.role as string | undefined
        router.replace(role === "recruiter" ? "/recruiter" : "/dashboard")
      }).catch(fallback)
      return
    }

    fallback()
  }, [router, searchParams])

  return null
} 