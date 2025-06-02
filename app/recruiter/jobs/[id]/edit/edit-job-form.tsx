"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AccessWrapper } from "@/components/recruiter/access-wrapper"
import { AnimatedCard } from "@/components/ui/animated-card"
import { FadeIn } from "@/components/ui/fade-in"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { updateJob } from "@/app/actions/jobs"
import { Loader2 } from "lucide-react"

export function EditJobForm({ job }: { job: any }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: job.title || "",
    status: job.status || "draft",
    industry: job.industry || "",
    role: job.role || "",
    country: job.country || "",
    price_range: job.price_range || "",
    lead_source: job.lead_source || "",
    commission_structure: job.commission_structure || "",
    team_size: job.team_size || "",
    remote_compatible: job.remote_compatible || false,
    company_overview: job.company_overview || "",
    what_you_sell: job.what_you_sell || "",
    sales_process: job.sales_process || "",
    whats_provided: job.whats_provided || [],
    not_for: job.not_for || "",
    commission_breakdown: job.commission_breakdown || "",
    ramp_time: job.ramp_time || "",
    working_hours: job.working_hours || "",
    video_url: job.video_url || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateJob(job.id, formData)
      toast.success("Job updated successfully!")
      router.push(`/recruiter/jobs`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update job")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProvidedChange = (value: string, index: number) => {
    const newProvided = [...formData.whats_provided]
    newProvided[index] = value
    setFormData({ ...formData, whats_provided: newProvided.filter(Boolean) })
  }

  const addProvidedItem = () => {
    setFormData({ ...formData, whats_provided: [...formData.whats_provided, ""] })
  }

  const removeProvidedItem = (index: number) => {
    const newProvided = formData.whats_provided.filter((_: string, i: number) => i !== index)
    setFormData({ ...formData, whats_provided: newProvided })
  }

  return (
    <AccessWrapper>
      <div className="container mx-auto max-w-4xl">
        <FadeIn delay={100}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Edit Job</h1>
            <p className="text-gray-400">Update your job listing details</p>
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <AnimatedCard variant="hover-glow" className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Basic Information</h2>
                
                <div>
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Senior Sales Executive"
                    required
                    minLength={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="role">Role Type</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value as any })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SDR/Appointment Setter">SDR/Appointment Setter</SelectItem>
                        <SelectItem value="AE/Closer">AE/Closer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      placeholder="e.g., SaaS, FinTech, Healthcare"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="e.g., United States"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Compensation */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Compensation</h2>
                
                <div>
                  <Label htmlFor="price_range">Price Range</Label>
                  <Input
                    id="price_range"
                    value={formData.price_range}
                    onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                    placeholder="e.g., $70,000 - $120,000 OTE"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="commission_structure">Commission Structure</Label>
                  <Input
                    id="commission_structure"
                    value={formData.commission_structure}
                    onChange={(e) => setFormData({ ...formData, commission_structure: e.target.value })}
                    placeholder="e.g., Base + Commission"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="commission_breakdown">Commission Breakdown (Optional)</Label>
                  <Textarea
                    id="commission_breakdown"
                    value={formData.commission_breakdown}
                    onChange={(e) => setFormData({ ...formData, commission_breakdown: e.target.value })}
                    placeholder="Detailed breakdown of commission structure..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Job Details */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Job Details</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lead_source">Lead Source</Label>
                    <Input
                      id="lead_source"
                      value={formData.lead_source}
                      onChange={(e) => setFormData({ ...formData, lead_source: e.target.value })}
                      placeholder="e.g., Inbound, Outbound, Mixed"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="team_size">Team Size</Label>
                    <Input
                      id="team_size"
                      value={formData.team_size}
                      onChange={(e) => setFormData({ ...formData, team_size: e.target.value })}
                      placeholder="e.g., 10-20 people"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ramp_time">Ramp Time (Optional)</Label>
                    <Input
                      id="ramp_time"
                      value={formData.ramp_time}
                      onChange={(e) => setFormData({ ...formData, ramp_time: e.target.value })}
                      placeholder="e.g., 3 months"
                    />
                  </div>

                  <div>
                    <Label htmlFor="working_hours">Working Hours (Optional)</Label>
                    <Input
                      id="working_hours"
                      value={formData.working_hours}
                      onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                      placeholder="e.g., 9-5 EST"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="remote"
                    checked={formData.remote_compatible}
                    onCheckedChange={(checked) => setFormData({ ...formData, remote_compatible: checked })}
                  />
                  <Label htmlFor="remote">Remote Compatible</Label>
                </div>
              </div>

              {/* Company Information */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Company Information</h2>
                
                <div>
                  <Label htmlFor="company_overview">Company Overview (Optional)</Label>
                  <Textarea
                    id="company_overview"
                    value={formData.company_overview}
                    onChange={(e) => setFormData({ ...formData, company_overview: e.target.value })}
                    placeholder="Brief overview of your company..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="what_you_sell">What You Sell (Optional)</Label>
                  <Textarea
                    id="what_you_sell"
                    value={formData.what_you_sell}
                    onChange={(e) => setFormData({ ...formData, what_you_sell: e.target.value })}
                    placeholder="Describe your products or services..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="sales_process">Sales Process (Optional)</Label>
                  <Textarea
                    id="sales_process"
                    value={formData.sales_process}
                    onChange={(e) => setFormData({ ...formData, sales_process: e.target.value })}
                    placeholder="Describe your sales process..."
                    rows={3}
                  />
                </div>
              </div>

              {/* What's Provided */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">What's Provided (Optional)</h2>
                
                {formData.whats_provided.map((item: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => handleProvidedChange(e.target.value, index)}
                      placeholder="e.g., Lead generation tools"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeProvidedItem(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addProvidedItem}
                  className="w-full"
                >
                  Add Item
                </Button>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Additional Information</h2>
                
                <div>
                  <Label htmlFor="not_for">Not For (Optional)</Label>
                  <Textarea
                    id="not_for"
                    value={formData.not_for}
                    onChange={(e) => setFormData({ ...formData, not_for: e.target.value })}
                    placeholder="Who this role is NOT suitable for..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="video_url">Video URL (Optional)</Label>
                  <Input
                    id="video_url"
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/recruiter/jobs")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Job"
                  )}
                </Button>
              </div>
            </form>
          </AnimatedCard>
        </FadeIn>
      </div>
    </AccessWrapper>
  )
} 