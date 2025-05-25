import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "./database.types"

// Create a single supabase client for interacting with your database
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  // Using browser client from @supabase/ssr to ensure auth cookies are set
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Client-side singleton
let supabaseClientInstance: ReturnType<typeof createSupabaseClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClientInstance) {
    supabaseClientInstance = createSupabaseClient()
  }
  return supabaseClientInstance
}
