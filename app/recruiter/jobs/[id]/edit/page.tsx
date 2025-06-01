"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { AnimatedInput } from "@/components/ui/animated-input"
import { FadeIn } from "@/components/ui/fade-in"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Upload, Building2, DollarSign, Briefcase, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { getSupabaseClient } from "@/lib/supabase/client"
import { updateJob } from "@/app/actions/jobs"

export default function EditJobPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string
  const supabase = getSupabaseClient()

  const [formData, setFormData] = useState({
    id: 0,
    title: "",
    industry: "",
    role: "AE/Closer",
    country: "",
    price_range: "",
    lead_source: "",
    commission_structure: "",
    team_size: "",
    remote_compatible: true,
    company_overview: "",
    what_you_sell: "",
    sales_process: "",
    not_for: "",
    commission_breakdown: "",
    ramp_time: "",
    working_hours: "",
    video_url: "",
    status: "draft" as 'draft' | 'active' | 'paused' | 'closed',
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError("Please log in to edit jobs")
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", jobId)
          .eq("recruiter_id", user.id)
          .single()

        if (error) {
          throw error
        }

        if (data) {
          setFormData({
            id: data.id,
            title: data.title,
            industry: data.industry,
            role: data.role || "AE/Closer",
            country: data.country || "",
            price_range: data.price_range,
            lead_source: data.lead_source,
            commission_structure: data.commission_structure,
            team_size: data.team_size,
            remote_compatible: data.remote_compatible,
            company_overview: data.company_overview || "",
            what_you_sell: data.what_you_sell || "",
            sales_process: data.sales_process || "",
            not_for: data.not_for || "",
            commission_breakdown: data.commission_breakdown || "",
            ramp_time: data.ramp_time || "",
            working_hours: data.working_hours || "",
            video_url: data.video_url || "",
            status: data.status,
          })
        } else {
          setError("Job not found")
        }
      } catch (err: any) {
        setError(err.message || "Failed to load job data")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [jobId, supabase])

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Error",
          description: "Please log in to save changes",
          variant: "destructive",
        })
        return
      }

      await updateJob(formData.id, {
        ...formData,
        role: formData.role as "AE/Closer" | "SDR/Appointment Setter",
        video_url: formData.video_url?.trim() ? formData.video_url : null,
      })

      toast({
        title: "Job updated",
        description: "Your job has been successfully updated.",
      })

      router.push("/recruiter/jobs")
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (status: 'draft' | 'active' | 'paused' | 'closed') => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Error",
          description: "Please log in to change job status",
          variant: "destructive",
        })
        return
      }

      await updateJob(formData.id, { status })
      setFormData((prev) => ({ ...prev, status }))

      toast({
        title: `Job ${status === "active" ? "activated" : status === "paused" ? "paused" : "moved to draft"}`,
        description: `The job status has been updated to ${status}.`,
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-12">
        <AnimatedCard variant="hover-glow" className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-purple-400">Loading job data...</div>
          </div>
        </AnimatedCard>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl py-12">
        <AnimatedCard variant="hover-glow" className="p-8">
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertTriangle className="h-12 w-12 text-red-400" />
            <h2 className="text-xl font-bold text-white">{error}</h2>
            <Link href="/recruiter/jobs">
              <AnimatedButton variant="outline">Back to Jobs</AnimatedButton>
            </Link>
          </div>
        </AnimatedCard>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <FadeIn delay={100}>
        <div className="flex items-center mb-8">
          <Link
            href="/recruiter/jobs"
            className="mr-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-700 transition-colors duration-300"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">Edit Job</h1>
            <p className="text-gray-400">{formData.title}</p>
          </div>
          <div className="space-x-2">
            {formData.status !== "active" && (
              <AnimatedButton
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("active")}
                className="bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20"
              >
                Activate
              </AnimatedButton>
            )}
            {formData.status !== "paused" && formData.status !== "draft" && (
              <AnimatedButton
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("paused")}
                className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20"
              >
                Pause
              </AnimatedButton>
            )}
            {formData.status !== "draft" && (
              <AnimatedButton
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("draft")}
                className="bg-gray-500/10 text-gray-400 border-gray-500/30 hover:bg-gray-500/20"
              >
                Move to Draft
              </AnimatedButton>
            )}
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={200}>
        <AnimatedCard variant="hover-glow" className="p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <Briefcase className="h-5 w-5 mr-2 text-purple-400" />
            Job Details
          </h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white">
                Job Title
              </Label>
              <AnimatedInput
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., Senior Closer - Executive Coaching"
                variant="glow"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="industry" className="text-white">
                  Industry
                </Label>
                <Select value={formData.industry} onValueChange={(value) => handleInputChange("industry", value)}>
                  <SelectTrigger className="border-dark-600 bg-dark-700 text-white focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 hover:border-purple-500/50">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-700 border-dark-600">
                    <SelectItem value="Biz Opp" className="text-white hover:bg-dark-600">
                      Biz Opp
                    </SelectItem>
                    <SelectItem value="B2B Enterprise" className="text-white hover:bg-dark-600">
                      B2B Enterprise
                    </SelectItem>
                    <SelectItem value="Coaching" className="text-white hover:bg-dark-600">
                      Coaching
                    </SelectItem>
                    <SelectItem value="Agency" className="text-white hover:bg-dark-600">
                      Agency
                    </SelectItem>
                    <SelectItem value="SaaS" className="text-white hover:bg-dark-600">
                      SaaS
                    </SelectItem>
                    <SelectItem value="Solar" className="text-white hover:bg-dark-600">
                      Solar
                    </SelectItem>
                    <SelectItem value="D2D" className="text-white hover:bg-dark-600">
                      D2D
                    </SelectItem>
                    <SelectItem value="Fitness" className="text-white hover:bg-dark-600">
                      Fitness
                    </SelectItem>
                    <SelectItem value="Real Estate" className="text-white hover:bg-dark-600">
                      Real Estate
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_range" className="text-white">
                  Offer Price Range
                </Label>
                <Select value={formData.price_range} onValueChange={(value) => handleInputChange("price_range", value)}>
                  <SelectTrigger className="border-dark-600 bg-dark-700 text-white focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 hover:border-purple-500/50">
                    <SelectValue placeholder="Select price range" />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-700 border-dark-600">
                    <SelectItem value="1-3k" className="text-white hover:bg-dark-600">
                      1-3k
                    </SelectItem>
                    <SelectItem value="3-6k" className="text-white hover:bg-dark-600">
                      3-6k
                    </SelectItem>
                    <SelectItem value="6-10k" className="text-white hover:bg-dark-600">
                      6-10k
                    </SelectItem>
                    <SelectItem value="10-15k" className="text-white hover:bg-dark-600">
                      10-15k
                    </SelectItem>
                    <SelectItem value="15k+" className="text-white hover:bg-dark-600">
                      15k+
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead_source" className="text-white">
                  Lead Source
                </Label>
                <Select value={formData.lead_source} onValueChange={(value) => handleInputChange("lead_source", value)}>
                  <SelectTrigger className="border-dark-600 bg-dark-700 text-white focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 hover:border-purple-500/50">
                    <SelectValue placeholder="Select lead source" />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-700 border-dark-600">
                    <SelectItem value="Paid Traffic" className="text-white hover:bg-dark-600">
                      Paid Traffic
                    </SelectItem>
                    <SelectItem value="Cold Calling" className="text-white hover:bg-dark-600">
                      Cold Calling
                    </SelectItem>
                    <SelectItem value="Hybrid" className="text-white hover:bg-dark-600">
                      Hybrid
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="commission_structure" className="text-white">
                  Commission Structure
                </Label>
                <Select
                  value={formData.commission_structure}
                  onValueChange={(value) => handleInputChange("commission_structure", value)}
                >
                  <SelectTrigger className="border-dark-600 bg-dark-700 text-white focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 hover:border-purple-500/50">
                    <SelectValue placeholder="Select commission structure" />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-700 border-dark-600">
                    <SelectItem value="100% Commission" className="text-white hover:bg-dark-600">
                      100% Commission
                    </SelectItem>
                    <SelectItem value="Base + Commission" className="text-white hover:bg-dark-600">
                      Base + Commission
                    </SelectItem>
                    <SelectItem value="Draw Against Commission" className="text-white hover:bg-dark-600">
                      Draw Against Commission
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="team_size" className="text-white">
                  Team Size / Sales Infra
                </Label>
                <Select value={formData.team_size} onValueChange={(value) => handleInputChange("team_size", value)}>
                  <SelectTrigger className="border-dark-600 bg-dark-700 text-white focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 hover:border-purple-500/50">
                    <SelectValue placeholder="Select team size" />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-700 border-dark-600">
                    <SelectItem value="Startup (1-2 reps)" className="text-white hover:bg-dark-600">
                      Startup (1-2 reps)
                    </SelectItem>
                    <SelectItem value="Scaling (2-6 reps)" className="text-white hover:bg-dark-600">
                      Scaling (2-6 reps)
                    </SelectItem>
                    <SelectItem value="Established (6+ reps)" className="text-white hover:bg-dark-600">
                      Established (6+ reps)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Remote Compatibility</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="remote"
                    checked={formData.remote_compatible}
                    onCheckedChange={(checked) => handleInputChange("remote_compatible", !!checked)}
                    className="border-dark-600 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                  />
                  <Label
                    htmlFor="remote"
                    className="text-sm text-gray-300 cursor-pointer hover:text-white transition-colors"
                  >
                    Remote Time Zone Compatible
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </AnimatedCard>
      </FadeIn>

      <FadeIn delay={300}>
        <AnimatedCard variant="hover-glow" className="p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-purple-400" />
            Company and Role Details
          </h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company_overview" className="text-white">
                Company Overview
              </Label>
              <Textarea
                id="company_overview"
                value={formData.company_overview}
                onChange={(e) => handleInputChange("company_overview", e.target.value)}
                placeholder="Describe your company, mission, and what makes it unique..."
                className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="what_you_sell" className="text-white">
                What You'll Be Selling (specific outcome + buyer)
              </Label>
              <Textarea
                id="what_you_sell"
                value={formData.what_you_sell}
                onChange={(e) => handleInputChange("what_you_sell", e.target.value)}
                placeholder="Describe the product/service, target audience, and value proposition..."
                className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sales_process" className="text-white">
                Sales Process (1-call close? Setters? CRM used?)
              </Label>
              <Textarea
                id="sales_process"
                value={formData.sales_process}
                onChange={(e) => handleInputChange("sales_process", e.target.value)}
                placeholder="Describe your sales process, tools used, and typical sales cycle..."
                className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="not_for" className="text-white">
                Who This Role Is NOT For (optional red-flag filter)
              </Label>
              <Textarea
                id="not_for"
                value={formData.not_for}
                onChange={(e) => handleInputChange("not_for", e.target.value)}
                placeholder="Describe who would NOT be a good fit for this role..."
                className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
              />
            </div>
          </div>
        </AnimatedCard>
      </FadeIn>

      <FadeIn delay={400}>
        <AnimatedCard variant="hover-glow" className="p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-purple-400" />
            Compensation and Logistics
          </h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="commission_breakdown" className="text-white">
                Commission Breakdown
              </Label>
              <Textarea
                id="commission_breakdown"
                value={formData.commission_breakdown}
                onChange={(e) => handleInputChange("commission_breakdown", e.target.value)}
                placeholder="Detail the commission structure, average earnings, and examples of top performer earnings..."
                className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ramp_time" className="text-white">
                Expected Ramp Time
              </Label>
              <AnimatedInput
                id="ramp_time"
                value={formData.ramp_time}
                onChange={(e) => handleInputChange("ramp_time", e.target.value)}
                placeholder="e.g., 2-3 weeks to first close, 6-8 weeks to full productivity"
                variant="glow"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="working_hours" className="text-white">
                Working Hours (Time Zone)
              </Label>
              <AnimatedInput
                id="working_hours"
                value={formData.working_hours}
                onChange={(e) => handleInputChange("working_hours", e.target.value)}
                placeholder="e.g., Flexible hours, but most calls happen 10am-6pm EST"
                variant="glow"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video_url" className="text-white">
                Video Intro from Business Owner (optional but recommended)
              </Label>
              <AnimatedInput
                id="video_url"
                value={formData.video_url}
                onChange={(e) => handleInputChange("video_url", e.target.value)}
                placeholder="e.g., https://www.loom.com/share/your-video-id"
                variant="glow"
              />
            </div>

            <div className="border-2 border-dashed border-dark-600 rounded-lg p-8 text-center hover:border-purple-500/50 transition-colors duration-300">
              <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">Or upload your video directly</p>
              <p className="text-sm text-gray-500">MP4, MOV, or WebM (max 100MB)</p>
              <AnimatedButton variant="outline" className="mt-4">
                Choose File
              </AnimatedButton>
            </div>
          </div>
        </AnimatedCard>
      </FadeIn>

      <FadeIn delay={500}>
        <div className="flex justify-between mb-16">
          <Link href="/recruiter/jobs">
            <AnimatedButton variant="outline">
              Cancel
            </AnimatedButton>
          </Link>
          <AnimatedButton variant="purple" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </AnimatedButton>
        </div>
      </FadeIn>
    </div>
  )
}
