import { useEffect, useMemo, useRef, useState } from "react"

export interface Notification {
  id: string
  title: string
  body?: string
  href?: string
  read: boolean
  created_at: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Keep a ref to WebSocket so we can cleanly close it on unmount
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    // Prefer env variable but fall back to localhost for dev
    const WS_URL = process.env.NEXT_PUBLIC_NOTIFICATIONS_WS || "ws://localhost:3001"

    const socket = new WebSocket(WS_URL)
    socketRef.current = socket

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        // Handle both single notification and array for initial load
        setNotifications((prev) => {
          if (Array.isArray(data)) {
            return [...data, ...prev]
          }
          return [data, ...prev]
        })
      } catch (error) {
        console.error("Failed to parse notification message", error)
      }
    }

    socket.onerror = (error) => {
      console.error("WebSocket error:", error)
    }

    return () => {
      socket.close()
    }
  }, [])

  // Derived values & helpers
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  return {
    notifications,
    unreadCount,
    markAllRead,
    markRead,
  }
} 