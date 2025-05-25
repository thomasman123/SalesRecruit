import { createServerSupabaseClient } from "@/lib/supabase/server"
import { type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type")
  const access_token = requestUrl.searchParams.get("access_token")
  const refresh_token = requestUrl.searchParams.get("refresh_token")

  // Password recovery flow
  if (type === "recovery" && access_token && refresh_token) {
    const supabase = createServerSupabaseClient()
    await supabase.auth.setSession({ access_token, refresh_token })

    return Response.redirect(new URL("/reset-password", requestUrl.origin))
  }

  if (code) {
    const supabase = createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.exchangeCodeForSession(code)

    // Determine redirect based on role
    const role = session?.user?.user_metadata?.role
    const redirectPath = role === "recruiter" ? "/recruiter" : "/dashboard"

    return Response.redirect(new URL(redirectPath, requestUrl.origin))
  }

  // Fallback: go home if something went wrong
  return Response.redirect(requestUrl.origin)
} 