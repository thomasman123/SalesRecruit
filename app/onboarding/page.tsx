"use client"

import { useState } from "react"
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

const TOTAL_SECTIONS = 5

export default function OnboardingPage() {
  const router = useRouter()
  const [currentSection, setCurrentSection] = useState(1)
  const [formData, setFormData] = useState({
    // Section 1: Background and Performance
    highestTicket: "",
    bestMonth: "",
    exactRole: "",
    leadDriedUp: "",
    commissionExperience: "",

    // Section 2: Sales Style and Offer Alignment
    salesProcess: "",
    thinkAboutIt: "",
    intangibleSales: "",
    dislikedClients: "",
    disagreedTechnique: "",

    // Section 3: Tools and Self-Management
    crmExperience: "",
    dailyRoutine: "",
    noShowProcess: "",
    callCapacity: "",

    // Section 4: Drive and Mindset
    whySales: "",
    slumpResponse: "",
    leadershipStyle: "",
    underperformResponse: "",
    currentImprovement: "",

    // Section 5: Video Intro
    videoUrl: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const sectionValidators: Record<number, () => boolean> = {
    1: () => {
      const { highestTicket, bestMonth, exactRole, leadDriedUp, commissionExperience } = formData
      return [highestTicket, bestMonth, exactRole, leadDriedUp, commissionExperience].every((t) => t.trim().length >= 30)
    },
    2: () => {
      const { salesProcess, thinkAboutIt, intangibleSales, dislikedClients, disagreedTechnique } = formData
      return [salesProcess, thinkAboutIt, intangibleSales, dislikedClients, disagreedTechnique].every((t) => t.trim().length >= 30)
    },
    3: () => {
      const { crmExperience, dailyRoutine, noShowProcess, callCapacity } = formData
      return [crmExperience, dailyRoutine, noShowProcess, callCapacity].every((t) => t.trim().length >= 20)
    },
    4: () => {
      const { whySales, slumpResponse, leadershipStyle, underperformResponse, currentImprovement } = formData
      return [whySales, slumpResponse, leadershipStyle, underperformResponse, currentImprovement].every((t) => t.trim().length >= 30)
    },
    5: () => {
      return formData.videoUrl.trim().length > 10
    },
  }

  const validateCurrent = (): boolean => {
    const valid = sectionValidators[currentSection]()
    if (!valid) {
      toast({
        title: "Incomplete section",
        description: "Please answer all questions in this section with sufficient detail before continuing.",
        variant: "destructive",
      })
    }
    return valid
  }

  const handleNext = () => {
    if (!validateCurrent()) return
    if (currentSection < TOTAL_SECTIONS) {
      setCurrentSection((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentSection > 1) {
      setCurrentSection((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!validateCurrent()) return
    setIsSubmitting(true)
    try {
      const supabase = getSupabaseClient()
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      // Persist onboarding responses into auth metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          onboarded: true,
          ...formData,
        },
      })
      if (error) throw error

      router.push('/dashboard')
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const sections = [
    {
      title: "Background and Performance",
      icon: <Briefcase className="w-5 h-5" />,
      description: "Tell us about your sales experience and achievements",
    },
    {
      title: "Sales Style and Offer Alignment",
      icon: <Target className="w-5 h-5" />,
      description: "Help us understand your approach to selling",
    },
    {
      title: "Tools and Self-Management",
      icon: <Wrench className="w-5 h-5" />,
      description: "Share your workflow and daily practices",
    },
    {
      title: "Drive and Mindset",
      icon: <Brain className="w-5 h-5" />,
      description: "What motivates you and how you handle challenges",
    },
    {
      title: "Video Introduction",
      icon: <Video className="w-5 h-5" />,
      description: "Record a brief video to introduce yourself",
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
                Welcome to Sales<span className="font-mono text-purple-400">Recruit</span>
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

              {/* Section 1: Background and Performance */}
              {currentSection === 1 && (
                <div className="space-y-6">
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

                  <div>
                    <Label className="text-white mb-2 block">
                      Tell us about your best month in sales — what made it work?
                    </Label>
                    <p className="text-sm text-gray-400 mb-3">
                      Share how many calls you took, your close rate, and why you performed well.
                    </p>
                    <Textarea
                      value={formData.bestMonth}
                      onChange={(e) => handleInputChange("bestMonth", e.target.value)}
                      placeholder="Example: July 2023 - $150K in revenue, 120 calls, 35% close rate. Success came from..."
                      className="min-h-[120px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">
                      What was your exact role in the last sales team you were part of?
                    </Label>
                    <p className="text-sm text-gray-400 mb-3">
                      Were you closing, setting, handling follow-up, building pipeline, etc.?
                    </p>
                    <Textarea
                      value={formData.exactRole}
                      onChange={(e) => handleInputChange("exactRole", e.target.value)}
                      placeholder="Example: Senior Closer - Handled warm transfers from setters, closed high-ticket coaching offers..."
                      className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">
                      When leads dried up in a previous role, what did you do to hit your targets?
                    </Label>
                    <p className="text-sm text-gray-400 mb-3">
                      We're looking for your ability to problem-solve, not just coast.
                    </p>
                    <Textarea
                      value={formData.leadDriedUp}
                      onChange={(e) => handleInputChange("leadDriedUp", e.target.value)}
                      placeholder="Example: I reached out to past clients for referrals, created content to attract leads..."
                      className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">
                      Have you sold 100% commission before? What did that teach you?
                    </Label>
                    <p className="text-sm text-gray-400 mb-3">
                      If yes, describe how you managed pressure and performance.
                    </p>
                    <Textarea
                      value={formData.commissionExperience}
                      onChange={(e) => handleInputChange("commissionExperience", e.target.value)}
                      placeholder="Example: Yes, for 2 years. It taught me discipline, consistency, and how to manage cash flow..."
                      className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Section 2: Sales Style and Offer Alignment */}
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
                      placeholder="Example: 1) Warm greeting and rapport building 2) Discovery questions to understand pain points..."
                      className="min-h-[150px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">
                      What do you say to a lead who says, "I need to think about it"?
                    </Label>
                    <p className="text-sm text-gray-400 mb-3">We're testing objection handling, not philosophy.</p>
                    <Textarea
                      value={formData.thinkAboutIt}
                      onChange={(e) => handleInputChange("thinkAboutIt", e.target.value)}
                      placeholder="Example: I completely understand. Most of my successful clients felt the same way. What specifically..."
                      className="min-h-[120px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">
                      Have you sold an offer that didn't have a tangible outcome (like mindset or coaching)? How did you
                      position it?
                    </Label>
                    <p className="text-sm text-gray-400 mb-3">
                      Selling transformation vs. deliverables is a different skillset.
                    </p>
                    <Textarea
                      value={formData.intangibleSales}
                      onChange={(e) => handleInputChange("intangibleSales", e.target.value)}
                      placeholder="Example: Yes, I sold executive mindset coaching. I focused on the ROI of better decision-making..."
                      className="min-h-[120px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">
                      What kind of clients or industries do you not enjoy selling to? Why?
                    </Label>
                    <p className="text-sm text-gray-400 mb-3">
                      Honest answers reveal self-awareness and alignment issues early.
                    </p>
                    <Textarea
                      value={formData.dislikedClients}
                      onChange={(e) => handleInputChange("dislikedClients", e.target.value)}
                      placeholder="Example: I struggle with clients who expect overnight results without putting in work..."
                      className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">
                      What's one sales belief or technique you strongly disagree with?
                    </Label>
                    <p className="text-sm text-gray-400 mb-3">Reveals how they think, not what they memorize.</p>
                    <Textarea
                      value={formData.disagreedTechnique}
                      onChange={(e) => handleInputChange("disagreedTechnique", e.target.value)}
                      placeholder="Example: I disagree with high-pressure closing tactics. I believe in creating genuine value..."
                      className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
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
                      placeholder="Example: HubSpot, Salesforce, and Pipedrive. Daily: Updated call notes, set follow-up tasks..."
                      className="min-h-[120px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">
                      What's your current daily routine when you're actively closing deals?
                    </Label>
                    <p className="text-sm text-gray-400 mb-3">
                      Morning to night — do they behave like a pro or a drifter?
                    </p>
                    <Textarea
                      value={formData.dailyRoutine}
                      onChange={(e) => handleInputChange("dailyRoutine", e.target.value)}
                      placeholder="Example: 7AM: Review pipeline, 8AM: Follow-ups, 9AM-12PM: Scheduled calls, 1PM: Admin..."
                      className="min-h-[120px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">
                      When a lead no-shows, what's your exact follow-up process?
                    </Label>
                    <p className="text-sm text-gray-400 mb-3">Tests consistency and personal accountability.</p>
                    <Textarea
                      value={formData.noShowProcess}
                      onChange={(e) => handleInputChange("noShowProcess", e.target.value)}
                      placeholder="Example: Call immediately, leave VM if no answer, send text, email within 30 min..."
                      className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">
                      How many calls per day can you realistically handle while maintaining high performance? Why that
                      number?
                    </Label>
                    <p className="text-sm text-gray-400 mb-3">
                      This cuts through bravado and exposes capacity vs burnout.
                    </p>
                    <Textarea
                      value={formData.callCapacity}
                      onChange={(e) => handleInputChange("callCapacity", e.target.value)}
                      placeholder="Example: 8-10 quality calls. This allows proper prep, focused conversations, and follow-up..."
                      className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
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
                      placeholder="Example: Financial freedom to support my family and the thrill of solving problems..."
                      className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">
                      What do you do when you hit a slump? Walk us through a time that happened.
                    </Label>
                    <p className="text-sm text-gray-400 mb-3">Mental resilience over motivation.</p>
                    <Textarea
                      value={formData.slumpResponse}
                      onChange={(e) => handleInputChange("slumpResponse", e.target.value)}
                      placeholder="Example: Q3 2022, went 0/15. I analyzed my calls, found I was rushing discovery..."
                      className="min-h-[120px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">
                      What type of leader or feedback style helps you perform at your best?
                    </Label>
                    <p className="text-sm text-gray-400 mb-3">Are they coachable, defensive, independent, or needy?</p>
                    <Textarea
                      value={formData.leadershipStyle}
                      onChange={(e) => handleInputChange("leadershipStyle", e.target.value)}
                      placeholder="Example: Direct feedback with specific examples. I prefer weekly 1:1s to stay aligned..."
                      className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">
                      Describe one time you were told you were underperforming. How did you respond?
                    </Label>
                    <p className="text-sm text-gray-400 mb-3">You want action-takers, not excuse-makers.</p>
                    <Textarea
                      value={formData.underperformResponse}
                      onChange={(e) => handleInputChange("underperformResponse", e.target.value)}
                      placeholder="Example: Manager said my discovery was weak. I recorded calls, studied top performers..."
                      className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">
                      What are you actively working on improving as a closer right now?
                    </Label>
                    <p className="text-sm text-gray-400 mb-3">
                      Self-aware people have goals. Everyone else has excuses.
                    </p>
                    <Textarea
                      value={formData.currentImprovement}
                      onChange={(e) => handleInputChange("currentImprovement", e.target.value)}
                      placeholder="Example: Tonality during objection handling. I'm practicing staying calm and curious..."
                      className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
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
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">Video URL</Label>
                    <p className="text-sm text-gray-400 mb-3">Loom, Dropbox, or Google Drive preferred</p>
                    <AnimatedInput
                      type="url"
                      value={formData.videoUrl}
                      onChange={(e) => handleInputChange("videoUrl", e.target.value)}
                      placeholder="https://www.loom.com/share/..."
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
              )}

              {/* Navigation Buttons */}
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
