"use client"

import { useState, useEffect } from "react"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { AnimatedInput } from "@/components/ui/animated-input"
import { FadeIn } from "@/components/ui/fade-in"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Save, Briefcase, Target, Wrench, Brain, Video, Upload } from "lucide-react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    avatarUrl: "",

    // Sales Experience
    highestTicket: "",
    bestMonth: "",
    exactRole: "",
    leadDriedUp: "",
    commissionExperience: "",

    // Sales Style
    salesProcess: "",
    thinkAboutIt: "",
    intangibleSales: "",
    dislikedClients: "",
    disagreedTechnique: "",

    // Tools and Self-Management
    crmExperience: "",
    dailyRoutine: "",
    noShowProcess: "",
    callCapacity: "",

    // Drive and Mindset
    whySales: "",
    slumpResponse: "",
    leadershipStyle: "",
    underperformResponse: "",
    currentImprovement: "",

    // Video Intro
    videoUrl: "",
  })

  const { toast } = useToast()

  useEffect(() => {
    async function fetchProfile() {
      try {
        const supabase = getSupabaseClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        if (user) {
          setFormData((prev) => ({
            ...prev,
            firstName: user.user_metadata?.first_name || "",
            lastName: user.user_metadata?.last_name || "",
            email: user.email || "",
            phone: user.user_metadata?.phone || "",
            location: user.user_metadata?.location || "",
            bio: user.user_metadata?.bio || "",
            avatarUrl: user.user_metadata?.avatar_url || "",
            // keep existing extended fields if previously saved
            ...user.user_metadata,
          }))
        }
      } catch (err: any) {
        console.error(err)
        toast({ title: "Failed to load profile", description: err.message, variant: "destructive" })
      }
    }
    fetchProfile()
  }, [toast])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const supabase = getSupabaseClient()
      const fileExt = file.name.split('.').pop()
      const filePath = `${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: false })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setFormData((prev) => ({ ...prev, avatarUrl: data.publicUrl }))
    } catch (err: any) {
      console.error(err)
      toast({ title: "Upload failed", description: err.message, variant: "destructive" })
    }
  }

  const handleSave = async () => {
    try {
      const supabase = getSupabaseClient()

      // Update auth user (email / password change requires secure reauth, skipping password here)
      const updates: any = {
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          full_name: `${formData.firstName} ${formData.lastName}`.trim(),
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio,
          avatar_url: formData.avatarUrl,
          // keep extended metadata
          highestTicket: formData.highestTicket,
          bestMonth: formData.bestMonth,
          exactRole: formData.exactRole,
          leadDriedUp: formData.leadDriedUp,
          commissionExperience: formData.commissionExperience,
          salesProcess: formData.salesProcess,
          thinkAboutIt: formData.thinkAboutIt,
          intangibleSales: formData.intangibleSales,
          dislikedClients: formData.dislikedClients,
          disagreedTechnique: formData.disagreedTechnique,
          crmExperience: formData.crmExperience,
          dailyRoutine: formData.dailyRoutine,
          noShowProcess: formData.noShowProcess,
          callCapacity: formData.callCapacity,
          whySales: formData.whySales,
          slumpResponse: formData.slumpResponse,
          leadershipStyle: formData.leadershipStyle,
          underperformResponse: formData.underperformResponse,
          currentImprovement: formData.currentImprovement,
        },
      }

      if (formData.email) {
        updates.email = formData.email
      }

      const { error } = await supabase.auth.updateUser(updates)
      if (error) throw error

      toast({ title: "Profile updated", description: "Your profile has been saved successfully." })
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" })
    }
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <FadeIn delay={100}>
        <div className="flex items-center mb-8">
          <Link
            href="/dashboard"
            className="mr-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-700 transition-colors duration-300"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold text-white">Your Profile</h1>
        </div>
      </FadeIn>

      <FadeIn delay={200}>
        <AnimatedCard variant="hover-glow" className="p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="flex flex-col items-center">
              <Avatar className="h-24 w-24 border-2 border-purple-500/30">
                <AvatarImage src={formData.avatarUrl || "/placeholder.svg?height=96&width=96&query=abstract profile"} />
                <AvatarFallback className="bg-purple-500/20 text-purple-400 text-2xl">{`${formData.firstName?.[0] || ""}${formData.lastName?.[0] || ""}`}</AvatarFallback>
              </Avatar>
              <label className="mt-4 text-sm cursor-pointer flex items-center gap-2 text-purple-400 hover:text-purple-300">
                <Upload className="h-4 w-4" /> Change Photo
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>

            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-300 text-sm">
                    First Name
                  </Label>
                  <AnimatedInput
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    variant="glow"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-300 text-sm">
                    Last Name
                  </Label>
                  <AnimatedInput
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    variant="glow"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 text-sm">
                  Email
                </Label>
                <AnimatedInput
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  variant="glow"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-300 text-sm">
                  Phone
                </Label>
                <AnimatedInput
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  variant="glow"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-gray-300 text-sm">
                  Location
                </Label>
                <AnimatedInput
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  variant="glow"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-gray-300 text-sm">
                  Professional Bio
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                />
              </div>
            </div>
          </div>
        </AnimatedCard>
      </FadeIn>

      <FadeIn delay={300}>
        <Tabs defaultValue="background" className="w-full">
          <TabsList className="grid grid-cols-5 bg-dark-700 p-1 mb-6">
            <TabsTrigger
              value="background"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 rounded-md transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25"
            >
              <Briefcase className="h-4 w-4 mr-2 md:mr-0 lg:mr-2" />
              <span className="hidden md:hidden lg:inline">Background</span>
            </TabsTrigger>
            <TabsTrigger
              value="sales-style"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 rounded-md transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25"
            >
              <Target className="h-4 w-4 mr-2 md:mr-0 lg:mr-2" />
              <span className="hidden md:hidden lg:inline">Sales Style</span>
            </TabsTrigger>
            <TabsTrigger
              value="tools"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 rounded-md transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25"
            >
              <Wrench className="h-4 w-4 mr-2 md:mr-0 lg:mr-2" />
              <span className="hidden md:hidden lg:inline">Tools</span>
            </TabsTrigger>
            <TabsTrigger
              value="mindset"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 rounded-md transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25"
            >
              <Brain className="h-4 w-4 mr-2 md:mr-0 lg:mr-2" />
              <span className="hidden md:hidden lg:inline">Mindset</span>
            </TabsTrigger>
            <TabsTrigger
              value="video"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 rounded-md transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25"
            >
              <Video className="h-4 w-4 mr-2 md:mr-0 lg:mr-2" />
              <span className="hidden md:hidden lg:inline">Video</span>
            </TabsTrigger>
          </TabsList>

          {/* Background and Performance */}
          <TabsContent value="background">
            <AnimatedCard variant="hover-glow" className="p-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-purple-400" />
                Background and Performance
              </h2>

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
                    className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </AnimatedCard>
          </TabsContent>

          {/* Sales Style and Offer Alignment */}
          <TabsContent value="sales-style">
            <AnimatedCard variant="hover-glow" className="p-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Target className="h-5 w-5 mr-2 text-purple-400" />
                Sales Style and Offer Alignment
              </h2>

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
                    className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </AnimatedCard>
          </TabsContent>

          {/* Tools and Self-Management */}
          <TabsContent value="tools">
            <AnimatedCard variant="hover-glow" className="p-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Wrench className="h-5 w-5 mr-2 text-purple-400" />
                Tools and Self-Management
              </h2>

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
                    className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </AnimatedCard>
          </TabsContent>

          {/* Drive and Mindset */}
          <TabsContent value="mindset">
            <AnimatedCard variant="hover-glow" className="p-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Brain className="h-5 w-5 mr-2 text-purple-400" />
                Drive and Mindset
              </h2>

              <div className="space-y-6">
                <div>
                  <Label className="text-white mb-2 block">
                    Why are you in sales — what does success in this role give you?
                  </Label>
                  <p className="text-sm text-gray-400 mb-3">This isn't a Hallmark moment. Look for real fuel.</p>
                  <Textarea
                    value={formData.whySales}
                    onChange={(e) => handleInputChange("whySales", e.target.value)}
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
                    className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <Label className="text-white mb-2 block">
                    What are you actively working on improving as a closer right now?
                  </Label>
                  <p className="text-sm text-gray-400 mb-3">Self-aware people have goals. Everyone else has excuses.</p>
                  <Textarea
                    value={formData.currentImprovement}
                    onChange={(e) => handleInputChange("currentImprovement", e.target.value)}
                    className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </AnimatedCard>
          </TabsContent>

          {/* Video Introduction */}
          <TabsContent value="video">
            <AnimatedCard variant="hover-glow" className="p-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Video className="h-5 w-5 mr-2 text-purple-400" />
                Video Introduction
              </h2>

              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="aspect-video max-w-2xl mx-auto bg-dark-700 rounded-lg flex items-center justify-center mb-6 border border-dark-600">
                    <iframe
                      src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                      className="w-full h-full rounded-lg"
                      title="Video introduction"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                    Your <span className="font-mono text-purple-400">60-second</span> video introduction
                  </p>
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
                  <p className="text-gray-400 mb-2">Upload a new video</p>
                  <p className="text-sm text-gray-500">MP4, MOV, or WebM (max 100MB)</p>
                  <AnimatedButton variant="outline" className="mt-4">
                    Choose File
                  </AnimatedButton>
                </div>
              </div>
            </AnimatedCard>
          </TabsContent>
        </Tabs>
      </FadeIn>

      <FadeIn delay={400}>
        <div className="mt-8 flex justify-end">
          <AnimatedButton
            variant="purple"
            onClick={handleSave}
            icon={<Save className="w-4 h-4" />}
          >
            Save Changes
          </AnimatedButton>
        </div>
      </FadeIn>
    </div>
  )
}
