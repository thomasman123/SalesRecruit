"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { FadeIn } from "@/components/ui/fade-in"
import { AnimatedIcon } from "@/components/ui/animated-icon"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Briefcase, 
  Users, 
  Eye, 
  Calendar,
  MoreVertical,
  Search,
  Filter
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"

interface Job {
  id: string
  title: string
  company: string
  location: string
  salary_range: string
  status: string
  views: number
  created_at: string
  _count?: { applicants: number }
}

export function RecruiterJobsContent() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'draft'>('all')

  useEffect(() => {
    fetchJobs()
  }, [filter])

  const fetchJobs = async () => {
    const supabase = getSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    let query = supabase
      .from('jobs')
      .select('*')
      .eq('recruiter_id', user.id)
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data, error } = await query

    if (!error && data) {
      // Get applicant counts
      const jobIds = data.map(job => job.id)

      let countsMap: Record<string, number> = {}
      if (jobIds.length > 0) {
        const { data: applicantCounts, error: applicantError } = await supabase
          .from('applicants')
          .select('job_id')
          .in('job_id', jobIds)

        if (!applicantError && applicantCounts) {
          countsMap = applicantCounts.reduce((acc, app) => {
            acc[app.job_id] = (acc[app.job_id] || 0) + 1
            return acc
          }, {} as Record<string, number>)
        }
      }

      const jobsWithCounts = data.map(job => ({
        ...job,
        _count: { applicants: countsMap[job.id] || 0 }
      }))

      setJobs(jobsWithCounts)
    }
    
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-dark-700 rounded w-1/4"></div>
          <div className="h-4 bg-dark-700 rounded w-1/2"></div>
          <div className="space-y-4 mt-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-dark-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl">
      <FadeIn delay={100}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Job Postings</h1>
            <p className="text-gray-400">Manage and track your job listings</p>
          </div>
          <Link href="/recruiter/jobs/new">
            <AnimatedButton variant="purple" icon={<Plus className="w-4 h-4" />}>
              Post New Job
            </AnimatedButton>
          </Link>
        </div>
      </FadeIn>

      <FadeIn delay={200}>
        <div className="flex gap-2 mb-6">
          {['all', 'active', 'draft'].map((status) => (
            <AnimatedButton
              key={status}
              variant={filter === status ? "purple" : "ghost"}
              size="sm"
              onClick={() => setFilter(status as any)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </AnimatedButton>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={300}>
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <AnimatedCard variant="hover-glow" className="p-12 text-center">
              <Briefcase className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Jobs Posted Yet</h3>
              <p className="text-gray-400 mb-6">
                Start attracting top sales talent by posting your first job
              </p>
              <Link href="/recruiter/jobs/new">
                <AnimatedButton variant="purple" icon={<Plus className="w-4 h-4" />}>
                  Post Your First Job
                </AnimatedButton>
              </Link>
            </AnimatedCard>
          ) : (
            jobs.map((job, index) => (
              <FadeIn key={job.id} delay={300 + index * 50}>
                <AnimatedCard variant="hover-glow" className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <AnimatedIcon variant="scale" size="sm" color="purple">
                            <Briefcase className="h-6 w-6" />
                          </AnimatedIcon>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white mb-2">{job.title}</h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
                            <span>{job.company}</span>
                            <span>•</span>
                            <span>{job.location}</span>
                            <span>•</span>
                            <span>{job.salary_range}</span>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-purple-400" />
                              <span className="text-sm text-gray-300">
                                {job._count?.applicants || 0} applicants
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4 text-purple-400" />
                              <span className="text-sm text-gray-300">
                                {job.views || 0} views
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-purple-400" />
                              <span className="text-sm text-gray-300">
                                Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 ml-4">
                      <Badge className={job.status === 'active' 
                        ? "bg-green-500/20 text-green-400 border-green-500/30" 
                        : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      }>
                        {job.status === 'active' ? 'Active' : 'Draft'}
                      </Badge>
                      
                      <div className="flex gap-2">
                        <Link href={`/recruiter/jobs/${job.id}/applicants`}>
                          <AnimatedButton variant="ghost" size="sm">
                            View Applicants
                          </AnimatedButton>
                        </Link>
                        <Link href={`/recruiter/jobs/${job.id}/edit`}>
                          <AnimatedButton variant="ghost" size="sm">
                            Edit
                          </AnimatedButton>
                        </Link>
                      </div>
                    </div>
                  </div>
                </AnimatedCard>
              </FadeIn>
            ))
          )}
        </div>
      </FadeIn>
    </div>
  )
} 