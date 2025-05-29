import { useEffect, useMemo, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"

export interface Notification {
  id: string
  title: string
  body?: string
  href?: string
  read: boolean
  created_at: string
  user_id: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const supabase = getSupabaseClient()

  useEffect(() => {
    let userId: string | null = null

    const init = async () => {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      userId = user.id

      // Fetch existing notifications
      const { data } = await (supabase as any)
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      if (data) setNotifications(data as Notification[])

      // Subscribe to realtime inserts for this user
      const channel = (supabase as any)
        .channel("notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload: any) => {
            const newNotif = payload.new as Notification
            setNotifications((prev) => [newNotif, ...prev])
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    const cleanupPromise = init()

    return () => {
      cleanupPromise.then((cleanup) => cleanup && cleanup())
    }
  }, [supabase])

  // Derived values & helpers
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    if (!notifications.length) return
    await (supabase as any)
      .from("notifications")
      .update({ read: true })
      .eq("user_id", notifications[0].user_id)
  }

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    await (supabase as any).from("notifications").update({ read: true }).eq("id", id)
  }

  return {
    notifications,
    unreadCount,
    markAllRead,
    markRead,
  }
} 