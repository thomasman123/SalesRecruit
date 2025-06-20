"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageContainer } from "@/components/layout/page-container"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { AnimatedInput } from "@/components/ui/animated-input"
import { FadeIn } from "@/components/ui/fade-in"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, ArrowLeft, Briefcase, Target, Wrench, Brain, Video, CheckCircle, Upload } from "lucide-react"
import { AnimatedIcon } from "@/components/ui/animated-icon"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

const TOTAL_SECTIONS = 5

export default function OnboardingPage() {
  const router = useRouter()
  const [currentSection, setCurrentSection] = useState(1)
  const [formData, setFormData] = useState({
    // Section 1: Basic Performance
    role: "",
    highestTicket: "",

    // Section 2: Sales Style
    salesProcess: "",

    // Section 3: Tools and Self-Management
    crmExperience: "",

    // Section 4: Drive and Mindset
    whySales: "",

    // Section 5: Video Intro
    videoUrl: "",
    avatarUrl: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  // Load existing onboarding data
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const metadata = user.user_metadata || {}
        if (metadata.onboarding_in_progress) {
          // Restore form data from metadata
          setFormData({
            role: metadata.role || "",
            highestTicket: metadata.highestTicket || "",
            salesProcess: metadata.salesProcess || "",
            crmExperience: metadata.crmExperience || "",
            whySales: metadata.whySales || "",
            videoUrl: metadata.videoUrl || "",
            avatarUrl: metadata.avatar_url || "",
          })

          // If we have data for a specific section, start from there
          if (metadata.highestTicket) setCurrentSection(2)
          if (metadata.salesProcess) setCurrentSection(3)
          if (metadata.crmExperience) setCurrentSection(4)
          if (metadata.whySales) setCurrentSection(5)
        }
      } catch (err) {
        console.error('Failed to load existing data:', err)
      }
    }

    loadExistingData()
  }, [])

  const autoSave = async (data: any) => {
    try {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Save current section data to auth metadata
      await supabase.auth.updateUser({
        data: {
          ...data,
          onboarding_in_progress: true,
        },
      })
    } catch (err) {
      console.error('Auto-save failed:', err)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }
      // Auto-save after input changes
      autoSave(newData)
      return newData
    })
  }

  const sectionValidators: Record<number, () => boolean> = {
    1: () => {
      const { role, highestTicket } = formData
      return Boolean(role) && highestTicket.trim().length >= 50
    },
    2: () => {
      const { salesProcess } = formData
      return salesProcess.trim().length >= 50
    },
    3: () => {
      const { crmExperience } = formData
      return crmExperience.trim().length >= 50
    },
    4: () => {
      const { whySales } = formData
      return whySales.trim().length >= 50
    },
    5: () => formData.videoUrl.trim().length > 0,
  }

  const validateCurrent = (): boolean => {
    const valid = sectionValidators[currentSection]()
    if (!valid) {
      toast({
        title: "Incomplete section",
        description: currentSection === 5 
          ? "Please provide a video URL before continuing."
          : "Please provide at least 50 characters of detail in your response before continuing.",
        variant: "destructive",
      })
    }
    return valid
  }

  const handleNext = async () => {
    if (!validateCurrent()) return
    if (currentSection < TOTAL_SECTIONS) {
      // Save current section data before moving to next section
      await autoSave(formData)
      setCurrentSection((prev) => prev + 1)
    }
  }

  const handlePrevious = async () => {
    if (currentSection > 1) {
      // Save current section data before moving to previous section
      await autoSave(formData)
      setCurrentSection((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!validateCurrent()) return
    setIsSubmitting(true)
    if (!formData.avatarUrl) {
      toast({ title: "Missing photo", description: "Please upload a profile picture.", variant: "destructive" })
      setIsSubmitting(false)
      return
    }
    try {
      const supabase = getSupabaseClient()
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("No authenticated user found")
      }

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          onboarded: true,
          onboarding_in_progress: false, // Mark onboarding as complete
          ...formData,
          avatar_url: formData.avatarUrl,
        },
      })
      if (authError) throw authError

      // Also update the database to ensure consistency
      const { error: dbError } = await supabase
        .from('users')
        .update({ onboarded: true })
        .eq('id', user.id)

      if (dbError) {
        console.error("Failed to update database onboarding status:", dbError)
        // Don't throw here, the auth metadata update is the important one
      }

      toast({
        title: "Welcome to Helios Recruit!",
        description: "Your profile is complete. Let's find your next opportunity.",
      })

      // Force a page reload to ensure middleware picks up the new status
      window.location.href = '/dashboard'
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Failed to complete onboarding",
        description: err.message || "Please try again",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const sections = [
    {
      title: "Basic Performance",
      icon: <Briefcase className="w-5 h-5" />,
      description: "Tell us about your key sales achievements",
    },
    {
      title: "Sales Style",
      icon: <Target className="w-5 h-5" />,
      description: "Share your approach to sales",
    },
    {
      title: "Tools & Routine",
      icon: <Wrench className="w-5 h-5" />,
      description: "Tell us about your work habits",
    },
    {
      title: "Drive & Mindset",
      icon: <Brain className="w-5 h-5" />,
      description: "Share your motivation and approach",
    },
    {
      title: "Video Introduction",
      icon: <Video className="w-5 h-5" />,
      description: "Share a link to a short intro video",
    },
  ]

  const progressPercentage = (currentSection / TOTAL_SECTIONS) * 100

  return (
    <PageContainer>
      <div className="min-h-screen py-12 px-6">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <FadeIn delay={0}>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">
                Welcome to Helios<span className="font-mono text-purple-400"> Recruit</span>
              </h1>
              <p className="text-gray-400 text-lg">Complete your profile to access opportunities</p>
            </div>
          </FadeIn>

          {/* Progress Bar */}
          <FadeIn delay={200}>
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-400">
                  Section {currentSection} of {TOTAL_SECTIONS}
                </span>
                <span className="text-sm text-purple-400 font-mono">{Math.round(progressPercentage)}% Complete</span>
              </div>
              <Progress value={progressPercentage} className="h-2 bg-dark-700" />
            </div>
          </FadeIn>

          {/* Section Indicators */}
          <FadeIn delay={300}>
            <div className="flex justify-between mb-12">
              {sections.map((section, index) => (
                <div
                  key={index}
                  className={`flex flex-col items-center ${
                    index + 1 === currentSection
                      ? "text-purple-400"
                      : index + 1 < currentSection
                        ? "text-green-400"
                        : "text-gray-600"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                      index + 1 === currentSection
                        ? "bg-purple-500/20 border-2 border-purple-500"
                        : index + 1 < currentSection
                          ? "bg-green-500/20 border-2 border-green-500"
                          : "bg-dark-700 border-2 border-dark-600"
                    }`}
                  >
                    {index + 1 < currentSection ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <AnimatedIcon variant={index + 1 === currentSection ? "pulse" : "scale"} size="sm">
                        {section.icon}
                      </AnimatedIcon>
                    )}
                  </div>
                  <span className="text-xs text-center hidden md:block max-w-[100px]">{section.title}</span>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Form Content */}
          <FadeIn delay={400} key={currentSection}>
            <AnimatedCard variant="hover-glow" className="p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">{sections[currentSection - 1].title}</h2>
                <p className="text-gray-400">{sections[currentSection - 1].description}</p>
              </div>

              {/* Section 1: Basic Performance */}
              {currentSection === 1 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-white mb-2 block">
                      What's your primary role in sales?
                    </Label>
                    <p className="text-sm text-gray-400 mb-3">
                      Select the role that best describes your current position
                    </p>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => handleInputChange("role", value)}
                      required
                    >
                      <SelectTrigger className="border-dark-600 bg-dark-700 text-white focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 hover:border-purple-500/50">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-700 border-dark-600">
                        <SelectItem
                          value="sdr"
                          className="text-white hover:bg-dark-600 transition-colors duration-200"
                        >
                          SDR/Appointment Setter
                        </SelectItem>
                        <SelectItem
                          value="ae"
                          className="text-white hover:bg-dark-600 transition-colors duration-200"
                        >
                          AE/Closer
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">
                      What's the highest-ticket offer you've personally closed?
                    </Label>
                    <p className="text-sm text-gray-400 mb-3">
                      Include price, what you were selling, and the target audience.
                    </p>
                    <Textarea
                      value={formData.highestTicket}
                      onChange={(e) => handleInputChange("highestTicket", e.target.value)}
                      placeholder="Example: $25,000 - Executive coaching program for C-suite leaders in tech startups..."
                      className="min-h-[120px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Section 2: Sales Style */}
              {currentSection === 2 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-white mb-2 block">
                      Walk us through your personal sales process. How do you take a lead from booked to closed?
                    </Label>
                    <p className="text-sm text-gray-400 mb-3">
                      Step-by-step: how you build trust, handle objections, and close.
                    </p>
                    <Textarea
                      value={formData.salesProcess}
                      onChange={(e) => handleInputChange("salesProcess", e.target.value)}
                      placeholder="Example: 1. Discovery call to understand needs 2. Value alignment 3. Objection handling..."
                      className="min-h-[150px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Section 3: Tools and Self-Management */}
              {currentSection === 3 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-white mb-2 block">
                      Which CRMs have you used to manage leads? How did you use them daily?
                    </Label>
                    <p className="text-sm text-gray-400 mb-3">
                      Describe how you tracked follow-ups, notes, and lead stages.
                    </p>
                    <Textarea
                      value={formData.crmExperience}
                      onChange={(e) => handleInputChange("crmExperience", e.target.value)}
                      placeholder="Example: I've used Salesforce and HubSpot extensively. In Salesforce, I maintained detailed..."
                      className="min-h-[120px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Section 4: Drive and Mindset */}
              {currentSection === 4 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-white mb-2 block">
                      Why are you in sales — what does success in this role give you?
                    </Label>
                    <p className="text-sm text-gray-400 mb-3">This isn't a Hallmark moment. Look for real fuel.</p>
                    <Textarea
                      value={formData.whySales}
                      onChange={(e) => handleInputChange("whySales", e.target.value)}
                      placeholder="Example: I love the challenge of high-ticket sales because..."
                      className="min-h-[120px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Section 5: Video Introduction */}
              {currentSection === 5 && (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <AnimatedIcon variant="pulse" size="xl" className="mx-auto mb-6">
                      <Video className="w-12 h-12" />
                    </AnimatedIcon>
                    <h3 className="text-xl font-semibold text-white mb-4">Record Your Video Introduction</h3>
                    <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                      Upload or link a <span className="font-mono text-purple-400">60-second</span> video where you:
                    </p>
                    <ul className="text-left max-w-md mx-auto space-y-3 mb-8">
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">Introduce yourself (name, location)</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">Share what you've sold</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">Tell us why you love sales</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">Briefly explain your approach to closing high-ticket</span>
                      </li>
                    </ul>
                    <div className="max-w-md mx-auto">
                      <Label htmlFor="videoUrl" className="text-gray-300 mb-2 block">
                        Paste video URL (Loom / Dropbox / Google Drive / etc.)
                      </Label>
                      <AnimatedInput
                        id="videoUrl"
                        value={formData.videoUrl}
                        onChange={(e) => handleInputChange("videoUrl", e.target.value)}
                        placeholder="https://loom.com/share/your-intro-video"
                        variant="glow"
                      />
                    </div>
                  </div>

                  {/* Profile Picture Upload */}
                  <div className="border-t border-dark-600 pt-8 mt-8">
                    <div className="text-center">
                      <AnimatedIcon variant="pulse" size="xl" className="mx-auto mb-4">
                        <Upload className="w-12 h-12" />
                      </AnimatedIcon>
                      <h3 className="text-xl font-semibold text-white mb-2">Profile Picture</h3>
                      <p className="text-gray-400 mb-6">
                        Upload a clear headshot so recruiters can put a face to the name
                      </p>

                      {formData.avatarUrl ? (
                        <div className="mb-4">
                          <img
                            src={formData.avatarUrl}
                            alt="Profile preview"
                            className="h-32 w-32 rounded-full object-cover border-2 border-purple-500/40 shadow-lg mx-auto"
                          />
                        </div>
                      ) : null}

                      <label 
                        className={`relative inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md cursor-pointer transition-colors ${isUploading ? "opacity-60 cursor-not-allowed" : ""}`}
                      > 
                        {isUploading ? "Uploading..." : "Choose Photo"}
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          disabled={isUploading}
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            setIsUploading(true)
                            try {
                              const supabase = getSupabaseClient()
                              const fileExt = file.name.split('.').pop()
                              const filePath = `${Date.now()}.${fileExt}`
                              const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: false })
                              if (uploadError) throw uploadError

                              const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
                              handleInputChange('avatarUrl', data.publicUrl)
                            } catch (err:any) {
                              console.error(err)
                              toast({ title: 'Upload failed', description: err.message, variant: 'destructive' })
                            } finally {
                              setIsUploading(false)
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8 pt-8 border-t border-dark-600">
                <AnimatedButton
                  variant="ghost"
                  onClick={handlePrevious}
                  disabled={currentSection === 1}
                  className={currentSection === 1 ? "opacity-50 cursor-not-allowed" : ""}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </AnimatedButton>

                {currentSection < TOTAL_SECTIONS ? (
                  <AnimatedButton
                    variant="purple"
                    onClick={handleNext}
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    Next Section
                  </AnimatedButton>
                ) : (
                  <AnimatedButton
                    variant="purple"
                    onClick={handleSubmit}
                    isLoading={isSubmitting}
                    icon={<CheckCircle className="w-4 h-4" />}
                  >
                    Complete Onboarding
                  </AnimatedButton>
                )}
              </div>
            </AnimatedCard>
          </FadeIn>
        </div>
      </div>
    </PageContainer>
  )
}
