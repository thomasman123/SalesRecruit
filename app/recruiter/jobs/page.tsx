"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { AnimatedInput } from "@/components/ui/animated-input"
import { FadeIn } from "@/components/ui/fade-in"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search,
  Plus,
  Users,
  Eye,
  Clock,
  Edit,
  Trash2,
  Copy,
  MoreHorizontal,
  Briefcase,
  CheckCircle,
  PauseCircle,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteJob, duplicateJob, updateJob } from "@/app/actions/jobs"
import type { Database } from "@/lib/supabase/database.types"

export default function JobsPage() {
  type Job = Database["public"]["Tables"]["jobs"]["Row"]

  const [jobs, setJobs] = useState<Job[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [jobToDelete, setJobToDelete] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchJobs = async () => {
      const supabase = getSupabaseClient()
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError) {
        console.error(userError)
        return
      }

      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("recruiter_id", user!.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error(error)
      } else {
        setJobs(data as any)
      }

      setLoading(false)
    }

    fetchJobs()
  }, [])

  const filteredJobs = jobs.filter((job) => {
    // Filter by search query
    if (searchQuery && !job.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Filter by tab
    if (activeTab === "active" && job.status !== "active") return false
    if (activeTab === "draft" && job.status !== "draft") return false
    if (activeTab === "paused" && job.status !== "paused") return false

    return true
  })

  const handleDeleteJob = (id: number) => {
    setJobToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteJob = async () => {
    if (jobToDelete) {
      try {
        await deleteJob(jobToDelete)
      setJobs((prev) => prev.filter((job) => job.id !== jobToDelete))
      toast({
        title: "Job deleted",
        description: "The job has been permanently deleted.",
        variant: "destructive",
      })
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" })
      }
    }
    setIsDeleteDialogOpen(false)
    setJobToDelete(null)
  }

  const handleDuplicateJob = async (id: number) => {
    try {
      const newJob = await duplicateJob(id)
      setJobs((prev) => [...prev, newJob])
      toast({
        title: "Job duplicated",
        description: "A copy of the job has been created as a draft.",
      })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const handleChangeStatus = async (id: number, status: "active" | "paused" | "draft") => {
    try {
      const updated = await updateJob(id, { status })
      setJobs((prev) => prev.map((j) => (j.id === id ? updated : j)))

    const statusMessages = {
      active: "Job activated",
      paused: "Job paused",
      draft: "Job moved to draft",
    }

    toast({
      title: statusMessages[status],
      description: `The job status has been updated to ${status}.`,
      variant: status === "active" ? "success" : "default",
    })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Active
          </Badge>
        )
      case "draft":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Draft
          </Badge>
        )
      case "paused":
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 flex items-center gap-1">
            <PauseCircle className="w-3 h-3" />
            Paused
          </Badge>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Job Listings</h1>
            <p className="text-gray-400">Manage your job postings and view applicants</p>
          </div>
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <AnimatedCard key={i} className="p-6">
              <div className="animate-pulse flex flex-col space-y-4">
                <div className="h-4 bg-dark-700 rounded w-1/4"></div>
                <div className="h-4 bg-dark-700 rounded w-1/2"></div>
                <div className="flex space-x-4">
                  <div className="h-3 bg-dark-700 rounded w-1/6"></div>
                  <div className="h-3 bg-dark-700 rounded w-1/6"></div>
                  <div className="h-3 bg-dark-700 rounded w-1/6"></div>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl">
      <FadeIn delay={100}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Job Listings</h1>
            <p className="text-gray-400">Manage your job postings and view applicants</p>
          </div>
          <Link href="/recruiter/jobs/new">
            <AnimatedButton variant="purple" icon={<Plus className="w-4 h-4" />}>
              Post New Job
            </AnimatedButton>
          </Link>
        </div>
      </FadeIn>

      <FadeIn delay={200}>
        <div className="mb-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <AnimatedInput
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                variant="glow"
              />
            </div>
          </div>

          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <TabsList className="bg-dark-700 p-1">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 rounded-md transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25"
              >
                All Jobs
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 rounded-md transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25"
              >
                Active
              </TabsTrigger>
              <TabsTrigger
                value="draft"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 rounded-md transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25"
              >
                Drafts
              </TabsTrigger>
              <TabsTrigger
                value="paused"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 rounded-md transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25"
              >
                Paused
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <ScrollArea className="h-[calc(100vh-20rem)]">
                <div className="space-y-4">
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job as any}
                        onDelete={handleDeleteJob}
                        onDuplicate={handleDuplicateJob}
                        onChangeStatus={handleChangeStatus}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Briefcase className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">No jobs found</h3>
                      <p className="text-gray-400 mb-6">
                        {searchQuery
                          ? "No jobs match your search criteria"
                          : activeTab === "all"
                            ? "You haven't created any jobs yet"
                            : `You don't have any ${activeTab} jobs`}
                      </p>
                      <Link href="/recruiter/jobs/new">
                        <AnimatedButton variant="purple" icon={<Plus className="w-4 h-4" />}>
                          Create Your First Job
                        </AnimatedButton>
                      </Link>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="active" className="mt-6">
              <ScrollArea className="h-[calc(100vh-20rem)]">
                <div className="space-y-4">
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job as any}
                        onDelete={handleDeleteJob}
                        onDuplicate={handleDuplicateJob}
                        onChangeStatus={handleChangeStatus}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">No active jobs</h3>
                      <p className="text-gray-400 mb-6">You don't have any active job listings</p>
                      <Link href="/recruiter/jobs/new">
                        <AnimatedButton variant="purple" icon={<Plus className="w-4 h-4" />}>
                          Create New Job
                        </AnimatedButton>
                      </Link>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="draft" className="mt-6">
              <ScrollArea className="h-[calc(100vh-20rem)]">
                <div className="space-y-4">
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job as any}
                        onDelete={handleDeleteJob}
                        onDuplicate={handleDuplicateJob}
                        onChangeStatus={handleChangeStatus}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">No draft jobs</h3>
                      <p className="text-gray-400 mb-6">You don't have any jobs in draft status</p>
                      <Link href="/recruiter/jobs/new">
                        <AnimatedButton variant="purple" icon={<Plus className="w-4 h-4" />}>
                          Create New Draft
                        </AnimatedButton>
                      </Link>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="paused" className="mt-6">
              <ScrollArea className="h-[calc(100vh-20rem)]">
                <div className="space-y-4">
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job as any}
                        onDelete={handleDeleteJob}
                        onDuplicate={handleDuplicateJob}
                        onChangeStatus={handleChangeStatus}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <PauseCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">No paused jobs</h3>
                      <p className="text-gray-400 mb-6">You don't have any paused job listings</p>
                      <Link href="/recruiter/jobs">
                        <AnimatedButton variant="outline">
                          View All Jobs
                        </AnimatedButton>
                      </Link>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </FadeIn>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-dark-800 border-dark-600">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action cannot be undone. This will permanently delete the job and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-dark-700 text-white border-dark-600 hover:bg-dark-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
              onClick={confirmDeleteJob}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface JobCardProps {
  job: Database["public"]["Tables"]["jobs"]["Row"]
  onDelete: (id: number) => void
  onDuplicate: (id: number) => void
  onChangeStatus: (id: number, status: "active" | "paused" | "draft") => void
}

function JobCard({ job, onDelete, onDuplicate, onChangeStatus }: JobCardProps) {
  const router = useRouter()
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return `${Math.floor(diffInDays / 365)} years ago`
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Check if the click was on a button or inside a button
    const target = e.target as HTMLElement
    const isButton = target.closest('button') || target.closest('a')
    
    if (!isButton) {
      router.push(`/recruiter/jobs/${job.id}/applicants`)
    }
  }

  return (
    <AnimatedCard 
      variant="hover-glow" 
      className="p-6 cursor-pointer transition-all hover:scale-[1.01]"
      onClick={handleCardClick}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-lg font-semibold text-white">{job.title}</h3>
            {job.status === "active" && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Active
              </Badge>
            )}
            {job.status === "draft" && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Draft
              </Badge>
            )}
            {job.status === "paused" && (
              <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 flex items-center gap-1">
                <PauseCircle className="w-3 h-3" />
                Paused
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-400">
              <Users className="w-4 h-4 mr-2 text-purple-400" />
              <span>{job.applicants_count} applicants</span>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <Eye className="w-4 h-4 mr-2 text-purple-400" />
              <span>{job.views} views</span>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <Clock className="w-4 h-4 mr-2 text-purple-400" />
              <span>Posted {formatDate(job.created_at)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className="bg-dark-700 text-gray-300 border-dark-600">{job.industry}</Badge>
            <Badge className="bg-dark-700 text-gray-300 border-dark-600">{job.price_range}</Badge>
            <Badge className="bg-dark-700 text-gray-300 border-dark-600">{job.lead_source}</Badge>
            <Badge className="bg-dark-700 text-gray-300 border-dark-600">{job.commission_structure}</Badge>
            <Badge className="bg-dark-700 text-gray-300 border-dark-600">{job.team_size}</Badge>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end md:self-center">
          <Link href={`/recruiter/jobs/${job.id}/applicants`}>
            <AnimatedButton variant="outline" size="sm">
              <Users className="w-4 h-4 mr-2" />
              Applicants
            </AnimatedButton>
          </Link>
          <Link href={`/recruiter/jobs/${job.id}/edit`}>
            <AnimatedButton variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </AnimatedButton>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-700 transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-dark-700 border-dark-600 text-white">
              {job.status !== "active" && (
                <DropdownMenuItem
                  className="hover:bg-dark-600 cursor-pointer"
                  onClick={() => onChangeStatus(job.id, "active")}
                >
                  <CheckCircle className="mr-2 h-4 w-4 text-green-400" />
                  <span>Activate Job</span>
                </DropdownMenuItem>
              )}
              {job.status !== "paused" && job.status !== "draft" && (
                <DropdownMenuItem
                  className="hover:bg-dark-600 cursor-pointer"
                  onClick={() => onChangeStatus(job.id, "paused")}
                >
                  <PauseCircle className="mr-2 h-4 w-4 text-yellow-400" />
                  <span>Pause Job</span>
                </DropdownMenuItem>
              )}
              {job.status !== "draft" && (
                <DropdownMenuItem
                  className="hover:bg-dark-600 cursor-pointer"
                  onClick={() => onChangeStatus(job.id, "draft")}
                >
                  <Clock className="mr-2 h-4 w-4 text-gray-400" />
                  <span>Move to Draft</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="hover:bg-dark-600 cursor-pointer" onClick={() => onDuplicate(job.id)}>
                <Copy className="mr-2 h-4 w-4" />
                <span>Duplicate</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-dark-600" />
              <DropdownMenuItem
                className="hover:bg-dark-600 cursor-pointer text-red-400 hover:text-red-300"
                onClick={() => onDelete(job.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </AnimatedCard>
  )
}
