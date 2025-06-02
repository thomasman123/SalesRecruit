import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "./database.types"

export async function createServerSupabaseClient() {
  // `cookies()` is async starting from Next.js v15. Awaiting works for both
  // the new async implementation and the previous synchronous one because
  // `await` on a non-Promise value returns the value itself.
  //
  // Doing the await here avoids the "cookies() should be awaited" error that
  // appears in recent Next.js versions when the function is used inside route
  // handlers.
  //
  // By keeping this utility async we only need to adjust call sites to use
  // `await createServerSupabaseClient()` while all other logic remains the
  // same.
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // In case of cookie error in server actions
            console.error(`Failed to set cookie ${name}:`, error)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete(name)
          } catch (error) {
            // Fallback to setting empty value if delete fails
            try {
              cookieStore.set({ name, value: "", ...options, maxAge: 0 })
            } catch (fallbackError) {
              console.error(`Failed to remove cookie ${name}:`, fallbackError)
            }
          }
        },
      },
    },
  )
}
