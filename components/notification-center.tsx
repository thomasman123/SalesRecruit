import Link from "next/link"
import { Bell } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/lib/hooks/use-notifications"
import { useEffect } from "react"

interface NotificationCenterProps {
  sidebarExpanded?: boolean
}

export function NotificationCenter({ sidebarExpanded }: NotificationCenterProps) {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications()

  // Scroll to top when new notifications added.
  useEffect(() => {
    // optional: we could scroll container to top.
  }, [notifications])

  return (
    <Sheet>
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
              onClick={markAllRead}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
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
              const NotificationWrapper = n.href ? Link : "div"
              const props: any = n.href ? { href: n.href } : {}
              return (
                <NotificationWrapper
                  key={n.id}
                  {...props}
                  onClick={() => markRead(n.id)}
                  className={cn(
                    "flex flex-col px-4 py-3 hover:bg-dark-700 transition-colors duration-300 focus:bg-dark-700 outline-none",
                    !n.read && "bg-dark-700/40",
                  )}
                >
                  <span className={cn("text-sm", n.read ? "text-gray-300" : "text-white font-medium")}>{n.title}</span>
                  {n.body && <span className="text-xs text-gray-400 mt-0.5">{n.body}</span>}
                  <span className="text-[10px] text-gray-500 mt-1">{new Date(n.created_at).toLocaleString()}</span>
                </NotificationWrapper>
              )
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
} 