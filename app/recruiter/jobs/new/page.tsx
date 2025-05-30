"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { AnimatedInput } from "@/components/ui/animated-input"
import { FadeIn } from "@/components/ui/fade-in"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Upload, Building2, DollarSign, Briefcase } from "lucide-react"
import Link from "next/link"
import { createJob } from "@/app/actions/jobs"
import { useToast } from "@/components/ui/use-toast"

export default function NewJobPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
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
    whats_provided: [] as string[],
    not_for: "",
    commission_breakdown: "",
    ramp_time: "",
    working_hours: "",
    video_url: "",
    status: "draft",
  })

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveAsDraft = async () => {
    try {
      await createJob({
        ...formData,
        status: "draft",
        video_url: formData.video_url?.trim() ? formData.video_url : null,
      } as any)
      toast({ title: "Job saved as draft" })
      router.push("/recruiter/jobs")
    } catch (err: any) {
      toast({
        title: err.message.length < 60 ? err.message : "Failed to create job",
        description: err.message.length >= 60 ? err.message : undefined,
        variant: "destructive",
      })
    }
  }

  const handlePublish = async () => {
    try {
      await createJob({
        ...formData,
        status: "active",
        video_url: formData.video_url?.trim() ? formData.video_url : null,
      } as any)
      toast({ title: "Job published" })
      router.push("/recruiter/jobs")
    } catch (err: any) {
      toast({
        title: err.message.length < 60 ? err.message : "Failed to create job",
        description: err.message.length >= 60 ? err.message : undefined,
        variant: "destructive",
      })
    }
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
          <h1 className="text-3xl font-bold text-white">Create New Job</h1>
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
                <Label htmlFor="role" className="text-white">
                  Role
                </Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                  <SelectTrigger className="border-dark-600 bg-dark-700 text-white focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 hover:border-purple-500/50">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-700 border-dark-600">
                    <SelectItem value="SDR/Appointment Setter" className="text-white hover:bg-dark-600">
                      SDR / Appointment Setter
                    </SelectItem>
                    <SelectItem value="AE/Closer" className="text-white hover:bg-dark-600">
                      AE / Closer
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-white">
                  Country
                </Label>
                <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
                  <SelectTrigger className="border-dark-600 bg-dark-700 text-white focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 hover:border-purple-500/50">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-700 border-dark-600 max-h-64 overflow-y-auto">
                    <SelectItem value="United States" className="text-white hover:bg-dark-600">United States</SelectItem>
                    <SelectItem value="Canada" className="text-white hover:bg-dark-600">Canada</SelectItem>
                    <SelectItem value="United Kingdom" className="text-white hover:bg-dark-600">United Kingdom</SelectItem>
                    <SelectItem value="Australia" className="text-white hover:bg-dark-600">Australia</SelectItem>
                    <SelectItem value="Germany" className="text-white hover:bg-dark-600">Germany</SelectItem>
                    <SelectItem value="France" className="text-white hover:bg-dark-600">France</SelectItem>
                    <SelectItem value="India" className="text-white hover:bg-dark-600">India</SelectItem>
                    <SelectItem value="Brazil" className="text-white hover:bg-dark-600">Brazil</SelectItem>
                    <SelectItem value="Remote" className="text-white hover:bg-dark-600">Remote</SelectItem>
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
                <Label htmlFor="lead_source" className="text-white">
                  Lead Source
                </Label>
                <Select value={formData.lead_source} onValueChange={(value) => handleInputChange("lead_source", value)}>
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
              <Label htmlFor="whats_provided" className="text-white">
                What's Provided (leads, CRM, script, training, etc.)
              </Label>
              <Textarea
                id="whats_provided"
                value={formData.whats_provided.join("\n")}
                onChange={(e) => handleInputChange("whats_provided", e.target.value.split("\n").filter(Boolean))}
                placeholder="List all resources, tools, and support provided to the sales rep..."
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
          <AnimatedButton variant="outline" onClick={handleSaveAsDraft}>
            <Save className="w-4 h-4 mr-2" />
            Save as Draft
          </AnimatedButton>
          <AnimatedButton variant="purple" onClick={handlePublish}>
            Publish Job
          </AnimatedButton>
        </div>
      </FadeIn>
    </div>
  )
}
