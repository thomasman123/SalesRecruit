"use client"

import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { FadeIn } from "@/components/ui/fade-in"
import { AnimatedIcon } from "@/components/ui/animated-icon"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  Briefcase,
  TrendingUp,
  Eye,
  UserCheck,
  Clock,
  Plus,
  ChevronRight,
  Calendar,
  MessageSquare,
  Building2,
} from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

export function RecruiterDashboardContent() {
  const [stats, setStats] = useState({ jobs: 0, applicants: 0, views: 0, interviews: 0 })
  const [recentApplicants, setRecentApplicants] = useState<any[]>([])
  const [recentJobs, setRecentJobs] = useState<any[]>([])
  const [recentMessages, setRecentMessages] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ count: activeJobs }, { data: jobRows }] = await Promise.all([
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('recruiter_id', user.id).eq('status', 'active'),
        supabase.from('jobs').select('id, views').eq('recruiter_id', user.id)
      ])

      const viewsTotal = jobRows?.reduce((t, r) => t + (r.views || 0), 0) ?? 0

      const jobIds = jobRows?.map(r => r.id) ?? []

      const [applicantRes, interviewRes, recentApplicantsRes, recentJobsRes] = await Promise.all([
        supabase.from('applicants').select('id', { count: 'exact', head: true }).in('job_id', jobIds),
        supabase.from('applicants').select('id', { count: 'exact', head: true }).in('job_id', jobIds).eq('status', 'interviewing'),
        supabase.from('applicants').select('name,email,avatar_url,job_id,status,created_at').in('job_id', jobIds).order('created_at', { ascending: false }).limit(4),
        supabase.from('jobs').select('*').eq('recruiter_id', user.id).order('created_at', { ascending: false }).limit(3)
      ])

      setStats({
        jobs: activeJobs ?? 0,
        applicants: applicantRes.count ?? 0,
        views: viewsTotal,
        interviews: interviewRes.count ?? 0,
      })

      setRecentApplicants(recentApplicantsRes.data ?? [])
      setRecentJobs(recentJobsRes.data ?? [])
    }
    load()
  }, [])

  return (
    <div className="container mx-auto max-w-7xl">
      <FadeIn delay={100}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Recruiter Dashboard</h1>
            <p className="text-gray-400">Manage your job postings and applicants</p>
          </div>
          <Link href="/recruiter/jobs/new">
            <AnimatedButton variant="purple" icon={<Plus className="w-4 h-4" />}>
              Post New Job
            </AnimatedButton>
          </Link>
        </div>
      </FadeIn>

      <FadeIn delay={200}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <AnimatedCard variant="hover-lift" className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Active Jobs</p>
                <h3 className="text-2xl font-bold text-white">
                  <span className="font-mono">{stats.jobs}</span>
                </h3>
              </div>
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <AnimatedIcon variant="scale" size="sm" color="purple">
                  <Briefcase className="h-5 w-5" />
                </AnimatedIcon>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard variant="hover-lift" className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Applicants</p>
                <h3 className="text-2xl font-bold text-white">
                  <span className="font-mono">{stats.applicants}</span>
                </h3>
              </div>
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <AnimatedIcon variant="scale" size="sm" color="purple">
                  <Users className="h-5 w-5" />
                </AnimatedIcon>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard variant="hover-lift" className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Job Views</p>
                <h3 className="text-2xl font-bold text-white">
                  <span className="font-mono">{stats.views}</span>
                </h3>
              </div>
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <AnimatedIcon variant="scale" size="sm" color="purple">
                  <Eye className="h-5 w-5" />
                </AnimatedIcon>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard variant="hover-lift" className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Interviews</p>
                <h3 className="text-2xl font-bold text-white">
                  <span className="font-mono">{stats.interviews}</span>
                </h3>
              </div>
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <AnimatedIcon variant="scale" size="sm" color="purple">
                  <UserCheck className="h-5 w-5" />
                </AnimatedIcon>
              </div>
            </div>
          </AnimatedCard>
        </div>
      </FadeIn>

      <FadeIn delay={300}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <AnimatedCard variant="hover-glow" className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Quick Actions</h2>
            </div>

            <div className="space-y-4">
              <Link href="/recruiter/jobs/new">
                <AnimatedCard variant="interactive" className="p-4 group">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mr-4 group-hover:bg-purple-500/20 transition-all duration-300">
                      <Plus className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium group-hover:text-purple-400 transition-colors duration-300">
                        Post New Job
                      </h3>
                      <p className="text-gray-400 text-sm">Create a new job listing to find sales talent</p>
                    </div>
                  </div>
                </AnimatedCard>
              </Link>

              <Link href="/recruiter/messages">
                <AnimatedCard variant="interactive" className="p-4 group">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mr-4 group-hover:bg-purple-500/20 transition-all duration-300">
                      <MessageSquare className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium group-hover:text-purple-400 transition-colors duration-300">
                        Message Candidates
                      </h3>
                      <p className="text-gray-400 text-sm">Reach out to potential candidates</p>
                    </div>
                  </div>
                </AnimatedCard>
              </Link>

              <Link href="/recruiter/profile">
                <AnimatedCard variant="interactive" className="p-4 group">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mr-4 group-hover:bg-purple-500/20 transition-all duration-300">
                      <Building2 className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium group-hover:text-purple-400 transition-colors duration-300">
                        Update Company Profile
                      </h3>
                      <p className="text-gray-400 text-sm">Enhance your company presence</p>
                    </div>
                  </div>
                </AnimatedCard>
              </Link>
            </div>
          </AnimatedCard>

          <AnimatedCard variant="hover-glow" className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Recent Activity</h2>
              <Link href="/recruiter/jobs">
                <AnimatedButton variant="ghost" size="sm" className="text-sm">
                  View All
                  <ChevronRight className="ml-1 w-4 h-4" />
                </AnimatedButton>
              </Link>
            </div>

            <div className="space-y-4">
              {recentJobs.length > 0 ? (
                recentJobs.map((job, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors duration-300"
                  >
                    <h3 className="text-white font-medium">{job.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {job.status === 'active' ? 'Active' : 'Draft'} • Posted {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No recent jobs</p>
              )}
            </div>
          </AnimatedCard>
        </div>
      </FadeIn>
    </div>
  )
} 