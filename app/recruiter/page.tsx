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

export default function RecruiterDashboardPage() {
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
        supabase.from('applicants').select('name,email,avatar_url,job_id,created_at').in('job_id', jobIds).order('created_at', { ascending: false }).limit(4),
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

      // recent messages placeholder until table ready
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
            <AnimatedButton variant="purple" animation="glow" icon={<Plus className="w-4 h-4" />}>
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
                <p className="text-xs text-green-400 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+1 this week</span>
                </p>
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
                <p className="text-xs text-green-400 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+8 this week</span>
                </p>
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
                <p className="text-xs text-green-400 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+35 this week</span>
                </p>
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
                <p className="text-xs text-purple-400 mt-1 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>3 upcoming</span>
                </p>
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
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="bg-dark-700 p-1 mb-6">
            <TabsTrigger
              value="recent"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 rounded-md transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25"
            >
              Recent Applicants
            </TabsTrigger>
            <TabsTrigger
              value="jobs"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 rounded-md transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25"
            >
              Active Jobs
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 rounded-md transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25"
            >
              Recent Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent">
            <AnimatedCard variant="hover-glow" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Recent Applicants</h2>
                <Link href="/recruiter/jobs">
                  <AnimatedButton variant="ghost" size="sm" animation="scale" className="text-sm">
                    View All
                    <ChevronRight className="ml-1 w-4 h-4" />
                  </AnimatedButton>
                </Link>
              </div>

              <div className="space-y-4">
                {recentApplicants.map((applicant, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors duration-300 cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-10 w-10 border border-dark-600">
                        <AvatarImage src={applicant.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="bg-purple-500/20 text-purple-400">
                          {applicant.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-white font-medium">{applicant.name}</h3>
                        <p className="text-gray-400 text-sm">{applicant.job_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium mr-4",
                          applicant.status === "new"
                            ? "bg-blue-500/20 text-blue-400"
                            : applicant.status === "reviewing"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : applicant.status === "interviewing"
                                ? "bg-purple-500/20 text-purple-400"
                                : "bg-green-500/20 text-green-400",
                        )}
                      >
                        {applicant.status === "new"
                          ? "New"
                          : applicant.status === "reviewing"
                            ? "Reviewing"
                            : applicant.status === "interviewing"
                              ? "Interviewing"
                              : "Hired"}
                      </div>
                      <span className="text-gray-500 text-xs">{applicant.created_at}</span>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedCard>
          </TabsContent>

          <TabsContent value="jobs">
            <AnimatedCard variant="hover-glow" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Active Job Postings</h2>
                <Link href="/recruiter/jobs">
                  <AnimatedButton variant="ghost" size="sm" animation="scale" className="text-sm">
                    Manage All Jobs
                    <ChevronRight className="ml-1 w-4 h-4" />
                  </AnimatedButton>
                </Link>
              </div>

              <div className="space-y-4">
                {recentJobs.map((job, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors duration-300 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-medium">{job.title}</h3>
                      <div
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium",
                          job.status === "active"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400",
                        )}
                      >
                        {job.status === "active" ? "Active" : "Draft"}
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-400 space-x-4">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1 text-purple-400" />
                        <span>{job.applicants} applicants</span>
                      </div>
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1 text-purple-400" />
                        <span>{job.views} views</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-purple-400" />
                        <span>{job.created_at}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedCard>
          </TabsContent>

          <TabsContent value="messages">
            <AnimatedCard variant="hover-glow" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Recent Messages</h2>
                <AnimatedButton variant="ghost" size="sm" animation="scale" className="text-sm">
                  View All Messages
                  <ChevronRight className="ml-1 w-4 h-4" />
                </AnimatedButton>
              </div>

              <div className="space-y-4">
                {recentMessages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-4 rounded-lg transition-colors duration-300 cursor-pointer",
                      message.unread ? "bg-purple-500/10 hover:bg-purple-500/15" : "bg-dark-800 hover:bg-dark-700",
                    )}
                  >
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-10 w-10 border border-dark-600">
                        <AvatarImage src={message.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="bg-purple-500/20 text-purple-400">
                          {message.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-white font-medium">{message.name}</h3>
                          <span className="text-gray-500 text-xs">{message.created_at}</span>
                        </div>
                        <p className="text-gray-400 text-sm line-clamp-2">{message.message}</p>
                      </div>
                      {message.unread && <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>}
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedCard>
          </TabsContent>
        </Tabs>
      </FadeIn>

      <FadeIn delay={400}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <AnimatedCard variant="hover-glow" className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Upcoming Interviews</h2>
              <AnimatedButton variant="ghost" size="sm" animation="scale" className="text-sm">
                View Calendar
                <Calendar className="ml-1 w-4 h-4" />
              </AnimatedButton>
            </div>

            <div className="space-y-4">
              {/* Placeholder for upcoming interviews */}
            </div>
          </AnimatedCard>

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
        </div>
      </FadeIn>
    </div>
  )
}
