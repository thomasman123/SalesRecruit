import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const supabase = createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.exchangeCodeForSession(code)

    const role = session?.user?.user_metadata?.role
    const redirectPath = role === "recruiter" ? "/recruiter" : "/dashboard"

    return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
  }

  return NextResponse.redirect(requestUrl.origin)
}
