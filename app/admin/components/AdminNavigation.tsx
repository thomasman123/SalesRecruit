"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  MessageSquare, 
  Calendar,
  Activity,
  BarChart3,
  Settings,
  LogOut,
  UserCheck,
  FileText,
  ShieldCheck,
  Menu,
  X
} from "lucide-react"
import { AnimatedButton } from "@/components/ui/animated-button"
import { AnimatedIcon } from "@/components/ui/animated-icon"
import { createSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Activity Logs", href: "/admin/activity", icon: Activity },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Recruiters", href: "/admin/recruiters", icon: ShieldCheck },
  { name: "Jobs", href: "/admin/jobs", icon: Briefcase },
  { name: "Applicants", href: "/admin/applicants", icon: UserCheck },
  { name: "Messages", href: "/admin/messages", icon: MessageSquare },
  { name: "Interviews", href: "/admin/interviews", icon: Calendar },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Reports", href: "/admin/reports", icon: FileText },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export default function AdminNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <AnimatedButton
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          variant="ghost"
          size="sm"
          className="text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </AnimatedButton>
      </div>

      {/* Sidebar */}
      <nav className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-dark-800 border-r border-dark-700 transform transition-transform duration-300 ease-in-out",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <AnimatedIcon variant="scale" size="sm" className="text-white">
                  <ShieldCheck className="w-6 h-6" />
                </AnimatedIcon>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Admin Panel</h2>
                <p className="text-xs text-gray-400">Helios Recruit</p>
              </div>
            </div>
          </div>

          <div className="flex-1 px-3 pb-4 overflow-y-auto">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== "/admin" && pathname.startsWith(item.href))
                
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive 
                          ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg" 
                          : "text-gray-300 hover:bg-dark-700 hover:text-white"
                      )}
                    >
                      <AnimatedIcon 
                        variant={isActive ? "pulse" : "scale"} 
                        size="sm"
                        className={isActive ? "text-white" : ""}
                      >
                        <item.icon className="w-5 h-5" />
                      </AnimatedIcon>
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="p-3 border-t border-dark-700">
            <AnimatedButton
              onClick={handleSignOut}
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-dark-700"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </AnimatedButton>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  )
} 