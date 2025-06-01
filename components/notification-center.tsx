import Link from "next/link"
import { Bell } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/lib/hooks/use-notifications"
import { useEffect, useState } from "react"

interface NotificationCenterProps {
  sidebarExpanded?: boolean
}

export function NotificationCenter({ sidebarExpanded }: NotificationCenterProps) {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  // Scroll to top when new notifications added.
  useEffect(() => {
    // optional: we could scroll container to top.
  }, [notifications])

  const handleNotificationClick = async (notificationId: string, href?: string) => {
    // Prevent multiple clicks
    if (processingIds.has(notificationId)) return
    
    setProcessingIds(prev => new Set(prev).add(notificationId))
    
    // Mark as read
    await markRead(notificationId)
    
    // Small delay to ensure the update is processed
    await new Promise(resolve => setTimeout(resolve, 100))
    
    setProcessingIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(notificationId)
      return newSet
    })
    
    // If there's a link, navigate after marking as read
    if (href) {
      setIsOpen(false)
      // Let the Link component handle navigation
    }
  }

  const handleMarkAllRead = async () => {
    await markAllRead()
    // Small delay to ensure UI updates
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          className={cn(
            "relative w-full flex items-center rounded-lg p-2 text-gray-400 hover:bg-dark-700 hover:text-white transition-colors duration-300",
            sidebarExpanded ? "justify-start" : "justify-center",
          )}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
          {sidebarExpanded && <span className="ml-3">Notifications</span>}
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="bg-dark-800 border-l border-dark-600 p-0 flex flex-col w-full sm:max-w-sm">
        <SheetHeader className="p-4 border-b border-dark-600 flex justify-between items-center">
          <SheetTitle className="text-white">Notifications</SheetTitle>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              disabled={processingIds.size > 0}
            >
              Mark all read
            </button>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto divide-y divide-dark-600">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-gray-400">You're all caught up 🎉</p>
          ) : (
            notifications.map((n) => {
              const isProcessing = processingIds.has(n.id)
              if (n.href) {
                return (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={(e) => {
                      e.preventDefault()
                      handleNotificationClick(n.id, n.href)
                      // Navigate after marking as read
                      setTimeout(() => {
                        window.location.href = n.href!
                      }, 150)
                    }}
                    className={cn(
                      "flex flex-col px-4 py-3 hover:bg-dark-700 transition-colors duration-300 focus:bg-dark-700 outline-none cursor-pointer",
                      !n.read && "bg-dark-700/40",
                      isProcessing && "opacity-50 cursor-wait"
                    )}
                  >
                    <span className={cn("text-sm", n.read ? "text-gray-300" : "text-white font-medium")}>{n.title}</span>
                    {n.body && <span className="text-xs text-gray-400 mt-0.5">{n.body}</span>}
                    <span className="text-[10px] text-gray-500 mt-1">{new Date(n.created_at).toLocaleString()}</span>
                  </Link>
                )
              } else {
                return (
                  <div
                    key={n.id}
                    onClick={() => !isProcessing && handleNotificationClick(n.id)}
                    className={cn(
                      "flex flex-col px-4 py-3 hover:bg-dark-700 transition-colors duration-300 focus:bg-dark-700 outline-none cursor-pointer",
                      !n.read && "bg-dark-700/40",
                      isProcessing && "opacity-50 cursor-wait"
                    )}
                  >
                    <span className={cn("text-sm", n.read ? "text-gray-300" : "text-white font-medium")}>{n.title}</span>
                    {n.body && <span className="text-xs text-gray-400 mt-0.5">{n.body}</span>}
                    <span className="text-[10px] text-gray-500 mt-1">{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                )
              }
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
} 