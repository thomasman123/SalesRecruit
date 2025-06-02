import { createServerSupabaseClient } from "@/lib/supabase/server"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedIcon } from "@/components/ui/animated-icon"
import { FadeIn } from "@/components/ui/fade-in"
import { 
  Users, 
  Briefcase, 
  UserCheck, 
  Calendar,
  MessageSquare,
  TrendingUp,
  Activity,
  Clock,
  ArrowRight
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
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Sales Professionals",
      value: stats?.total_sales_professionals || 0,
      icon: UserCheck,
      href: "/admin/users?role=sales-professional",
      color: "from-green-500 to-green-600"
    },
    {
      title: "Active Jobs",
      value: stats?.active_jobs || 0,
      icon: Briefcase,
      href: "/admin/jobs",
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Total Applicants",
      value: stats?.total_applicants || 0,
      icon: UserCheck,
      href: "/admin/applicants",
      color: "from-orange-500 to-orange-600"
    },
    {
      title: "Upcoming Interviews",
      value: stats?.upcoming_interviews || 0,
      icon: Calendar,
      href: "/admin/interviews",
      color: "from-indigo-500 to-indigo-600"
    },
    {
      title: "Messages Today",
      value: stats?.messages_today || 0,
      icon: MessageSquare,
      href: "/admin/messages",
      color: "from-pink-500 to-pink-600"
    },
    {
      title: "Active Users Today",
      value: stats?.active_users_today || 0,
      icon: Activity,
      href: "/admin/activity",
      color: "from-cyan-500 to-cyan-600"
    },
    {
      title: "Total Admins",
      value: stats?.total_admins || 0,
      icon: Users,
      href: "/admin/users?role=admin",
      color: "from-red-500 to-red-600"
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
      <FadeIn delay={0}>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Monitor all platform activity and manage users</p>
        </div>
      </FadeIn>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <FadeIn key={stat.title} delay={100 + index * 50}>
            <Link href={stat.href}>
              <AnimatedCard variant="hover-lift" className="p-6 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value.toLocaleString()}</p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <AnimatedIcon variant="scale" size="sm" className="text-white">
                      <stat.icon className="w-6 h-6" />
                    </AnimatedIcon>
                  </div>
                </div>
              </AnimatedCard>
            </Link>
          </FadeIn>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <FadeIn delay={600}>
          <AnimatedCard variant="hover-glow" className="h-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                <Link href="/admin/activity" className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 group">
                  View all 
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="space-y-3">
                {recentActivity && recentActivity.length > 0 ? (
                  recentActivity.map((activity: any) => (
                    <div key={activity.id} className="flex items-start gap-3 text-sm p-3 rounded-lg hover:bg-dark-700 transition-colors">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0 animate-pulse" />
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium text-gray-300">{activity.user_email}</span>
                          <span className="text-gray-500 text-xs">({activity.user_role})</span>
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
          </AnimatedCard>
        </FadeIn>

        {/* Active Users */}
        <FadeIn delay={700}>
          <AnimatedCard variant="hover-glow" className="h-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Most Active Users</h2>
                <Link href="/admin/users" className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 group">
                  View all 
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="space-y-3">
                {userActivity && userActivity.length > 0 ? (
                  userActivity.map((user: any) => (
                    <div key={user.user_id} className="flex items-center justify-between p-3 rounded-lg hover:bg-dark-700 transition-colors">
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
          </AnimatedCard>
        </FadeIn>
      </div>
    </div>
  )
} 