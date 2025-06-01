import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { 
  Users, 
  Briefcase, 
  UserCheck, 
  Calendar,
  MessageSquare,
  TrendingUp,
  Activity,
  Clock
} from "lucide-react"
import Link from "next/link"

async function getAdminStats() {
  const supabase = await createServerSupabaseClient()
  
  // Fetch all stats in parallel
  const [
    { data: stats },
    { data: recentActivity },
    { data: userActivity }
  ] = await Promise.all([
    supabase.from('admin_dashboard_stats').select('*').single(),
    supabase.from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('admin_user_activity_summary')
      .select('*')
      .order('last_activity', { ascending: false })
      .limit(5)
  ])

  return { stats, recentActivity, userActivity }
}

export default async function AdminDashboard() {
  const { stats, recentActivity, userActivity } = await getAdminStats()

  const statCards = [
    {
      title: "Total Recruiters",
      value: stats?.total_recruiters || 0,
      icon: Users,
      href: "/admin/users?role=recruiter",
      color: "text-blue-500"
    },
    {
      title: "Sales Professionals",
      value: stats?.total_sales_professionals || 0,
      icon: UserCheck,
      href: "/admin/users?role=sales-professional",
      color: "text-green-500"
    },
    {
      title: "Active Jobs",
      value: stats?.active_jobs || 0,
      icon: Briefcase,
      href: "/admin/jobs",
      color: "text-purple-500"
    },
    {
      title: "Total Applicants",
      value: stats?.total_applicants || 0,
      icon: UserCheck,
      href: "/admin/applicants",
      color: "text-orange-500"
    },
    {
      title: "Upcoming Interviews",
      value: stats?.upcoming_interviews || 0,
      icon: Calendar,
      href: "/admin/interviews",
      color: "text-indigo-500"
    },
    {
      title: "Messages Today",
      value: stats?.messages_today || 0,
      icon: MessageSquare,
      href: "/admin/messages",
      color: "text-pink-500"
    },
    {
      title: "Active Users Today",
      value: stats?.active_users_today || 0,
      icon: Activity,
      href: "/admin/activity",
      color: "text-cyan-500"
    },
    {
      title: "Total Admins",
      value: stats?.total_admins || 0,
      icon: Users,
      href: "/admin/users?role=admin",
      color: "text-red-500"
    }
  ]

  const formatActionType = (action: string) => {
    return action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    
    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
      { label: 'second', seconds: 1 }
    ]
    
    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds)
      if (count > 0) {
        return count === 1 
          ? `${count} ${interval.label} ago`
          : `${count} ${interval.label}s ago`
      }
    }
    
    return 'just now'
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Monitor all platform activity and manage users</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="p-6 bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card className="bg-gray-900 border-gray-800">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
              <Link href="/admin/activity" className="text-sm text-purple-400 hover:text-purple-300">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-gray-300">{activity.user_email}</span>
                        <span className="text-gray-500">({activity.user_role})</span>
                      </div>
                      <div className="text-gray-400">
                        {formatActionType(activity.action_type)} - {activity.entity_type}
                        {activity.metadata?.title && (
                          <span className="text-gray-300"> "{activity.metadata.title}"</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {formatTimeAgo(activity.created_at)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No recent activity</p>
              )}
            </div>
          </div>
        </Card>

        {/* Active Users */}
        <Card className="bg-gray-900 border-gray-800">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Most Active Users</h2>
              <Link href="/admin/users" className="text-sm text-purple-400 hover:text-purple-300">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {userActivity && userActivity.length > 0 ? (
                userActivity.map((user: any) => (
                  <div key={user.user_id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-300">{user.name}</div>
                      <div className="text-sm text-gray-500">
                        {user.email} • {user.role}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-300">
                        {user.actions_today} today
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.total_actions} total
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No user activity data</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 