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
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { createSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Activity Logs", href: "/admin/activity", icon: Activity },
  { name: "Users", href: "/admin/users", icon: Users },
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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <nav className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800">
      <div className="flex flex-col h-full">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Admin Panel</h2>
              <p className="text-xs text-gray-400">Helios Recruit</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-3 pb-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/admin" && pathname.startsWith(item.href))
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive 
                        ? "bg-purple-600 text-white" 
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="p-3 border-t border-gray-800">
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  )
} 