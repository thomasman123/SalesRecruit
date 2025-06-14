import { createServerSupabaseClient } from "./supabase/server"
import { redirect } from "next/navigation"

export async function getSession() {
  const supabase = await createServerSupabaseClient()

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}

export async function refreshSession() {
  const supabase = await createServerSupabaseClient()

  try {
    const {
      data: { session },
      error
    } = await supabase.auth.refreshSession()
    
    if (error) {
      console.error("Error refreshing session:", error)
      return null
    }
    
    return session
  } catch (error) {
    console.error("Error in refreshSession:", error)
    return null
  }
}

export async function getUserDetails() {
  const supabase = await createServerSupabaseClient()

  try {
    // First try to get session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      // Try to refresh if no session
      const refreshedSession = await refreshSession()
      if (!refreshedSession) return null
    }
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    // Get additional user details from the users table
    const { data: userDetails } = await supabase.from("users").select("*").eq("id", user.id).single()

    return userDetails
  } catch (error) {
    console.error("Error getting user details:", error)
    return null
  }
}

export async function requireAuth() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return session
}

export async function requireRecruiterRole() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const userDetails = await getUserDetails()

  if (!userDetails || userDetails.role !== "recruiter") {
    redirect("/dashboard")
  }

  return userDetails
}

export async function requireAdminRole() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const userDetails = await getUserDetails()

  if (!userDetails || userDetails.role !== "admin") {
    redirect("/")
  }

  return userDetails
}

export async function requireRecruiterOrAdminRole() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const userDetails = await getUserDetails()

  if (!userDetails || (userDetails.role !== "recruiter" && userDetails.role !== "admin")) {
    redirect("/dashboard")
  }

  return userDetails
}
