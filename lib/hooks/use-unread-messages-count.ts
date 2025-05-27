import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/hooks/use-user"

export function useUnreadMessagesCount() {
  const { userData, isLoading } = useUser()
  const [count, setCount] = useState(0)
  const supabase = getSupabaseClient()

  useEffect(() => {
    if (isLoading || !userData) return

    let isMounted = true

    async function fetchCount() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const role = userData!.role === "recruiter" ? "recruiter" : "sales-professional"
      const column = role === "recruiter" ? "recruiter_id" : "applicant_user_id"
      const { data, error } = await supabase
        .from("conversations")
        .select("unread_count")
        .eq(column, user.id)

      if (error) {
        console.error("Error fetching unread count", error)
        return
      }

      const total = (data || []).reduce((sum: number, row: any) => sum + (row.unread_count || 0), 0)
      if (isMounted) setCount(total)
    }

    fetchCount()

    // Listen for new or updated messages to refresh count
    const channel = supabase
      .channel("unread-messages-count")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        fetchCount,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        fetchCount,
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [isLoading, userData])

  return count
} 