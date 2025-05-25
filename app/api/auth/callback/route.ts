import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type")
  const access_token = requestUrl.searchParams.get("access_token")
  const refresh_token = requestUrl.searchParams.get("refresh_token")

  if (code) {
    const supabase = createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.exchangeCodeForSession(code)

    const role = session?.user?.user_metadata?.role
    const redirectPath = role === "recruiter" ? "/recruiter" : "/dashboard"

    return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
  }

  // Password recovery
  if (type === "recovery" && access_token && refresh_token) {
    const supabase = createServerSupabaseClient()
    await supabase.auth.setSession({ access_token, refresh_token })

    return NextResponse.redirect(new URL("/reset-password", requestUrl.origin))
  }

  return NextResponse.redirect(requestUrl.origin)
}
