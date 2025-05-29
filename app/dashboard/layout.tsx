"use client"

import type React from "react"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { AnimatedIcon } from "@/components/ui/animated-icon"
import { BackgroundEffects } from "@/components/ui/background-effects"
import {
  LayoutDashboard,
  Users,
  Briefcase,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  User,
  LogOut,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useUser } from "@/lib/hooks/use-user"
import { NotificationCenter } from "@/components/notification-center"
import { Badge } from "@/components/ui/badge"
import { useUnreadMessagesCount } from "@/lib/hooks/use-unread-messages-count"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const { userData, handleLogout } = useUser()
  const unreadMessageCount = useUnreadMessagesCount()

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      current: pathname === "/dashboard",
    },
    {
      name: "Opportunities",
      href: "/dashboard/opportunities",
      icon: <Briefcase className="h-5 w-5" />,
      current: pathname === "/dashboard/opportunities",
    },
    {
      name: "Network",
      href: "/dashboard/network",
      icon: <Users className="h-5 w-5" />,
      current: pathname === "/dashboard/network",
    },
    {
      name: "Messages",
      href: "/dashboard/messages",
      icon: <MessageSquare className="h-5 w-5" />,
      current: pathname === "/dashboard/messages",
      badge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
    },
  ]

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 relative">
      <BackgroundEffects />

      {/* Mobile menu */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-dark-900/95 backdrop-blur-sm transition-all duration-300 md:hidden",
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <div className="flex justify-end p-4">
          <button onClick={toggleMobileMenu} className="text-gray-400 hover:text-white transition-colors duration-300">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 p-3 rounded-lg transition-all duration-300",
                item.current ? "bg-purple-500/20 text-purple-400" : "text-gray-400 hover:bg-dark-700 hover:text-white",
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              <AnimatedIcon variant="scale" size="sm" color={item.current ? "purple" : "white"}>
                {item.icon}
              </AnimatedIcon>
              <span className="ml-3">{item.name}</span>
              {item.badge && <Badge className="ml-auto bg-purple-500 text-white">{item.badge}</Badge>}
            </Link>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-40 bg-dark-800/80 backdrop-blur-sm border-r border-dark-600 transition-all duration-300 ease-in-out hidden md:flex md:flex-col",
          sidebarExpanded ? "w-64" : "w-20",
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-dark-600">
          <div className={cn("flex items-center", sidebarExpanded ? "justify-between w-full" : "justify-center")}>
            {sidebarExpanded && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold text-white">
                  Helios<span className="font-mono text-purple-400"> Recruit</span>
                </span>
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-700 transition-colors duration-300"
            >
              {sidebarExpanded ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center rounded-lg transition-all duration-300",
                sidebarExpanded ? "px-3 py-2" : "justify-center p-3",
                item.current ? "bg-purple-500/20 text-purple-400" : "text-gray-400 hover:bg-dark-700 hover:text-white",
              )}
            >
              <AnimatedIcon variant="scale" size="sm" color={item.current ? "purple" : "white"}>
                {item.icon}
              </AnimatedIcon>
              {sidebarExpanded && (
                <>
                  <span className="ml-3">{item.name}</span>
                  {item.badge && <Badge className="ml-auto bg-purple-500 text-white">{item.badge}</Badge>}
                </>
              )}
              {!sidebarExpanded && item.badge && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center text-[10px] font-bold">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom user section */}
        <div className="p-4 border-t border-dark-600 space-y-4">
          {/* Notifications */}
          <NotificationCenter sidebarExpanded={sidebarExpanded} />

          {/* Profile dropdown trigger */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "w-full flex items-center rounded-lg p-2 text-gray-400 hover:bg-dark-700 hover:text-white transition-colors duration-300",
                sidebarExpanded ? "justify-start" : "justify-center",
              )}>
                <Avatar className="h-8 w-8 border border-dark-600">
                  <AvatarImage src={userData?.avatar_url || "/placeholder.svg?height=32&width=32&query=abstract profile"} />
                  <AvatarFallback className="bg-purple-500/20 text-purple-400">
                    {userData?.full_name?.split(" ").map(n => n[0]).join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                {sidebarExpanded && (
                  <div className="ml-3 text-left">
                    <div className="text-sm font-medium text-white truncate" style={{maxWidth:'8rem'}}>{userData?.full_name || "User"}</div>
                    <div className="text-xs text-gray-400">Sales Professional</div>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-dark-700 border-dark-600 text-white">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-dark-600" />
              <DropdownMenuItem asChild className="hover:bg-dark-600 cursor-pointer">
                <Link href="/dashboard/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-dark-600 cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-dark-600" />
              <DropdownMenuItem 
                className="hover:bg-dark-600 cursor-pointer text-red-400 hover:text-red-300"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </aside>

      {/* Main content */}
      <div className={cn("transition-all duration-300 ease-in-out", sidebarExpanded ? "md:ml-64" : "md:ml-20")}>
        {/* Mobile Header (menu toggle only) */}
        <header className="sticky top-0 z-30 bg-dark-800/80 backdrop-blur-sm border-b border-dark-600 md:hidden">
          <div className="flex items-center h-16 px-4">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-700 transition-colors duration-300"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 relative z-10">{children}</main>
      </div>
    </div>
  )
}
