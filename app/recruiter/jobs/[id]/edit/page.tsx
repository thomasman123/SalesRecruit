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
import { mockJobs } from "@/lib/mock-data"
import { toast } from "@/components/ui/use-toast"

export default function EditJobPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const [formData, setFormData] = useState({
    id: 0,
    title: "",
    industry: "",
    priceRange: "",
    leadSource: "",
    commissionStructure: "",
    teamSize: "",
    remoteCompatible: true,
    companyOverview: "",
    whatYouSell: "",
    salesProcess: "",
    whatsProvided: "",
    notFor: "",
    commissionBreakdown: "",
    rampTime: "",
    workingHours: "",
    videoUrl: "",
    status: "draft",
    applicants: 0,
    views: 0,
    posted: "",
    expires: "",
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    // Fetch job data
    const fetchJob = () => {
      setLoading(true)
      try {
        const job = mockJobs.find((job) => job.id === Number.parseInt(jobId))

        if (job) {
          setFormData({
            id: job.id,
            title: job.title,
            industry: job.industry,
            priceRange: job.priceRange,
            leadSource: job.leadSource,
            commissionStructure: job.commissionStructure,
            teamSize: job.teamSize,
            remoteCompatible: job.remoteCompatible,
            companyOverview: job.companyOverview || "",
            whatYouSell: job.whatYouSell || "",
            salesProcess: job.salesProcess || "",
            whatsProvided: job.whatsProvided ? job.whatsProvided.join("\n") : "",
            notFor: job.notFor || "",
            commissionBreakdown: job.commissionBreakdown || "",
            rampTime: job.rampTime || "",
            workingHours: job.workingHours || "",
            videoUrl: job.videoUrl || "",
            status: job.status,
            applicants: job.applicants,
            views: job.views,
            posted: job.posted,
            expires: job.expires,
          })
        } else {
          setError("Job not found")
        }
      } catch (err) {
        setError("Failed to load job data")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [jobId])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    // In a real app, this would be an API call to update the job
    console.log("Saving job:", formData)

    // Show success toast
    toast({
      title: "Job updated",
      description: "Your job has been successfully updated.",
      variant: "default",
    })

    // Redirect back to jobs page
    router.push("/recruiter/jobs")
  }

  const handleStatusChange = (status: string) => {
    setFormData((prev) => ({ ...prev, status }))

    toast({
      title: `Job ${status === "active" ? "activated" : status === "paused" ? "paused" : "moved to draft"}`,
      description: `The job status has been updated to ${status}.`,
      variant: "default",
    })
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
                    <SelectItem value="Coaching" className="text-white hover:bg-dark-600">
                      Coaching
                    </SelectItem>
                    <SelectItem value="Agency" className="text-white hover:bg-dark-600">
                      Agency
                    </SelectItem>
                    <SelectItem value="SaaS" className="text-white hover:bg-dark-600">
                      SaaS
                    </SelectItem>
                    <SelectItem value="Fitness" className="text-white hover:bg-dark-600">
                      Fitness
                    </SelectItem>
                    <SelectItem value="E-commerce" className="text-white hover:bg-dark-600">
                      E-commerce
                    </SelectItem>
                    <SelectItem value="Real Estate" className="text-white hover:bg-dark-600">
                      Real Estate
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priceRange" className="text-white">
                  Offer Price Range
                </Label>
                <Select value={formData.priceRange} onValueChange={(value) => handleInputChange("priceRange", value)}>
                  <SelectTrigger className="border-dark-600 bg-dark-700 text-white focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 hover:border-purple-500/50">
                    <SelectValue placeholder="Select price range" />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-700 border-dark-600">
                    <SelectItem value="$1-3K" className="text-white hover:bg-dark-600">
                      $1-3K
                    </SelectItem>
                    <SelectItem value="$3-10K" className="text-white hover:bg-dark-600">
                      $3-10K
                    </SelectItem>
                    <SelectItem value="$10K+" className="text-white hover:bg-dark-600">
                      $10K+
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leadSource" className="text-white">
                  Lead Source
                </Label>
                <Select value={formData.leadSource} onValueChange={(value) => handleInputChange("leadSource", value)}>
                  <SelectTrigger className="border-dark-600 bg-dark-700 text-white focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 hover:border-purple-500/50">
                    <SelectValue placeholder="Select lead source" />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-700 border-dark-600">
                    <SelectItem value="Inbound" className="text-white hover:bg-dark-600">
                      Inbound
                    </SelectItem>
                    <SelectItem value="Outbound" className="text-white hover:bg-dark-600">
                      Outbound
                    </SelectItem>
                    <SelectItem value="Hybrid" className="text-white hover:bg-dark-600">
                      Hybrid
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="commissionStructure" className="text-white">
                  Commission Structure
                </Label>
                <Select
                  value={formData.commissionStructure}
                  onValueChange={(value) => handleInputChange("commissionStructure", value)}
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
                <Label htmlFor="teamSize" className="text-white">
                  Team Size / Sales Infra
                </Label>
                <Select value={formData.teamSize} onValueChange={(value) => handleInputChange("teamSize", value)}>
                  <SelectTrigger className="border-dark-600 bg-dark-700 text-white focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 hover:border-purple-500/50">
                    <SelectValue placeholder="Select team size" />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-700 border-dark-600">
                    <SelectItem value="Solo closer" className="text-white hover:bg-dark-600">
                      Solo closer
                    </SelectItem>
                    <SelectItem value="Setters in place" className="text-white hover:bg-dark-600">
                      Setters in place
                    </SelectItem>
                    <SelectItem value="Full team" className="text-white hover:bg-dark-600">
                      Full team
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Remote Compatibility</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="remote"
                    checked={formData.remoteCompatible}
                    onCheckedChange={(checked) => handleInputChange("remoteCompatible", !!checked)}
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
              <Label htmlFor="companyOverview" className="text-white">
                Company Overview
              </Label>
              <Textarea
                id="companyOverview"
                value={formData.companyOverview}
                onChange={(e) => handleInputChange("companyOverview", e.target.value)}
                placeholder="Describe your company, mission, and what makes it unique..."
                className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatYouSell" className="text-white">
                What You'll Be Selling (specific outcome + buyer)
              </Label>
              <Textarea
                id="whatYouSell"
                value={formData.whatYouSell}
                onChange={(e) => handleInputChange("whatYouSell", e.target.value)}
                placeholder="Describe the product/service, target audience, and value proposition..."
                className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salesProcess" className="text-white">
                Sales Process (1-call close? Setters? CRM used?)
              </Label>
              <Textarea
                id="salesProcess"
                value={formData.salesProcess}
                onChange={(e) => handleInputChange("salesProcess", e.target.value)}
                placeholder="Describe your sales process, tools used, and typical sales cycle..."
                className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsProvided" className="text-white">
                What's Provided (leads, CRM, script, training, etc.)
              </Label>
              <Textarea
                id="whatsProvided"
                value={formData.whatsProvided}
                onChange={(e) => handleInputChange("whatsProvided", e.target.value)}
                placeholder="List all resources, tools, and support provided to the sales rep..."
                className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notFor" className="text-white">
                Who This Role Is NOT For (optional red-flag filter)
              </Label>
              <Textarea
                id="notFor"
                value={formData.notFor}
                onChange={(e) => handleInputChange("notFor", e.target.value)}
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
              <Label htmlFor="commissionBreakdown" className="text-white">
                Commission Breakdown
              </Label>
              <Textarea
                id="commissionBreakdown"
                value={formData.commissionBreakdown}
                onChange={(e) => handleInputChange("commissionBreakdown", e.target.value)}
                placeholder="Detail the commission structure, average earnings, and examples of top performer earnings..."
                className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rampTime" className="text-white">
                Expected Ramp Time
              </Label>
              <AnimatedInput
                id="rampTime"
                value={formData.rampTime}
                onChange={(e) => handleInputChange("rampTime", e.target.value)}
                placeholder="e.g., 2-3 weeks to first close, 6-8 weeks to full productivity"
                variant="glow"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workingHours" className="text-white">
                Working Hours (Time Zone)
              </Label>
              <AnimatedInput
                id="workingHours"
                value={formData.workingHours}
                onChange={(e) => handleInputChange("workingHours", e.target.value)}
                placeholder="e.g., Flexible hours, but most calls happen 10am-6pm EST"
                variant="glow"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoUrl" className="text-white">
                Video Intro from Business Owner (optional but recommended)
              </Label>
              <AnimatedInput
                id="videoUrl"
                value={formData.videoUrl}
                onChange={(e) => handleInputChange("videoUrl", e.target.value)}
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
            <AnimatedButton variant="outline" animation="scale">
              Cancel
            </AnimatedButton>
          </Link>
          <AnimatedButton variant="purple" animation="glow" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </AnimatedButton>
        </div>
      </FadeIn>
    </div>
  )
}
