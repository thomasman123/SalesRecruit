"use client"

import { useState } from "react"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedInput } from "@/components/ui/animated-input"
import { FadeIn } from "@/components/ui/fade-in"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { getSupabaseClient } from "@/lib/supabase/client"

export default function PostJobPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    salary: "",
    country: "",
    region: "",
  })

  const { toast } = useToast()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('opportunities')
        .insert([{
          ...formData,
          created_at: new Date().toISOString(),
        }])
      
      if (error) throw error
      
      toast({ title: "Success", description: "Job posting created successfully" })
      // Reset form or redirect
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-12">
      <FadeIn delay={100}>
        <h1 className="text-3xl font-bold text-white mb-8">Post a New Opportunity</h1>
      </FadeIn>

      <FadeIn delay={200}>
        <AnimatedCard variant="hover-glow" className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="country" className="text-gray-300 text-sm">
                  Country
                </Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => handleInputChange("country", value)}
                  required
                >
                  <SelectTrigger className="border-dark-600 bg-dark-700 text-white focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 hover:border-purple-500/50">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-700 border-dark-600">
                    <SelectItem value="us" className="text-white hover:bg-dark-600 transition-colors duration-200">
                      United States
                    </SelectItem>
                    <SelectItem value="ca" className="text-white hover:bg-dark-600 transition-colors duration-200">
                      Canada
                    </SelectItem>
                    <SelectItem value="uk" className="text-white hover:bg-dark-600 transition-colors duration-200">
                      United Kingdom
                    </SelectItem>
                    <SelectItem value="au" className="text-white hover:bg-dark-600 transition-colors duration-200">
                      Australia
                    </SelectItem>
                    <SelectItem value="nz" className="text-white hover:bg-dark-600 transition-colors duration-200">
                      New Zealand
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="region" className="text-gray-300 text-sm">
                  Region/State
                </Label>
                <AnimatedInput
                  id="region"
                  value={formData.region}
                  onChange={(e) => handleInputChange("region", e.target.value)}
                  placeholder="e.g., California, Ontario, London"
                  variant="glow"
                />
              </div>
            </div>

            {/* Add other form fields here */}
          </form>
        </AnimatedCard>
      </FadeIn>
    </div>
  )
} 