"use client"

import { useState } from "react"
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

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@example.com",
    location: "New York, NY",
    bio: "Senior sales professional with 8+ years of experience in SaaS and high-ticket coaching sales.",

    // Section 1: Background and Performance
    highestTicket:
      "I closed a $35,000 executive coaching program targeting C-suite leaders in tech startups. The program focused on leadership development and scaling strategies.",
    bestMonth:
      "July 2023 - Generated $180K in revenue from 110 calls with a 38% close rate. Success came from refining my qualification process and focusing on pain points rather than features.",
    exactRole:
      "Senior Closer at TechGrowth Solutions. I handled warm transfers from setters, conducted discovery calls, and closed high-ticket coaching and consulting packages.",
    leadDriedUp:
      "I implemented a referral system with past clients offering commission for successful referrals. I also created targeted LinkedIn content to attract inbound leads and revived cold leads with a new value proposition.",
    commissionExperience:
      "Yes, for 2.5 years at StartupMentors. It taught me extreme ownership of my pipeline, disciplined follow-up processes, and how to manage cash flow during slower months by building reserves during strong periods.",

    // Section 2: Sales Style and Offer Alignment
    salesProcess:
      "1) Warm greeting and rapport building (2-3 min)\n2) Set expectations for the call (1 min)\n3) Deep discovery questions focused on current situation, desired outcome, and obstacles (15-20 min)\n4) Transition by summarizing pain points and confirming accuracy (2 min)\n5) Present solution as bridge between current and desired state (5 min)\n6) Handle objections with empathy and specific examples (5-10 min)\n7) Close with clear next steps and payment process (5 min)",
    thinkAboutIt:
      "I understand completely. Most of my successful clients initially felt the same way. Can I ask - what specifically do you need to think about? Is it the investment, the timing, or something else? [Listen carefully] Based on what you've shared about [specific pain point], waiting another [timeframe] could cost you [specific consequence]. What would make this an easier decision for you today?",
    intangibleSales:
      "Yes, I sold executive mindset coaching. I positioned it by quantifying the cost of indecision and poor leadership - turnover costs, missed opportunities, stress-related productivity loss. I used specific client success stories with measurable outcomes like 'reduced executive turnover by 35%' and 'increased team productivity by 28%' to make the intangible tangible.",
    dislikedClients:
      "I struggle with clients who expect overnight results without putting in work. Specifically, small business owners who want enterprise-level growth but resist implementing necessary systems or investing appropriate resources. These engagements often lead to misaligned expectations and frustration on both sides.",
    disagreedTechnique:
      "I strongly disagree with the 'always be closing' mentality that treats every interaction as a closing opportunity. This creates unnecessary pressure and damages trust. I believe in always providing value and earning the right to close through genuine understanding of client needs. This builds stronger relationships and higher lifetime value.",

    // Section 3: Tools and Self-Management
    crmExperience:
      "HubSpot, Salesforce, and Close.io. Daily workflow: Morning pipeline review, tagging leads by stage, setting follow-up tasks with specific dates/times, detailed call notes including objections and personal details, and creating custom fields to track lead source effectiveness.",
    dailyRoutine:
      "6:30AM: Exercise and mindset work\n8:00AM: Review pipeline and prioritize day\n8:30AM: Research upcoming calls\n9:00AM-12:00PM: Scheduled calls\n12:00PM-1:00PM: Lunch and quick break\n1:00PM-2:00PM: Follow-ups and admin\n2:00PM-4:30PM: Afternoon calls\n4:30PM-5:30PM: CRM updates and next day prep",
    noShowProcess:
      "1) Wait 5 minutes on the line\n2) Call them immediately\n3) If no answer, leave voicemail expressing concern\n4) Send text message within 2 minutes\n5) Follow up with email offering reschedule options\n6) Add task in CRM for follow-up call next day\n7) If still no response, follow up 2 more times over 7 days before tagging as cold",
    callCapacity:
      "8-10 quality calls per day. This allows 30 minutes of prep before each call, 45-60 minutes for the call itself, and 15-20 minutes for thorough follow-up and CRM updates. More than this leads to decreased performance as I can't properly prepare or follow up, which impacts conversion rates.",

    // Section 4: Drive and Mindset
    whySales:
      "Sales gives me three things I deeply value: financial freedom to support my family, intellectual challenge of solving complex problems, and measurable impact on businesses and people. I'm driven by the direct relationship between effort and results, and the constant growth required to succeed.",
    slumpResponse:
      "Q1 2022, I went 2/25 on closes after previously averaging 35%. I analyzed call recordings and identified I was rushing discovery and making assumptions. I created a new discovery framework with specific questions, practiced active listening techniques, and had my manager review calls. Within 3 weeks, I was back to 30%+ close rates.",
    leadershipStyle:
      "I perform best with leaders who provide clear expectations and regular, direct feedback. I prefer weekly 1:1s with specific metrics review and actionable feedback rather than vague direction. I value autonomy in execution but appreciate guidance on strategy and regular check-ins on progress.",
    underperformResponse:
      "My sales director told me my discovery process wasn't deep enough, leading to weak proposals. Instead of defending myself, I asked for specific examples, shadowed top performers, and created a new discovery framework. I asked for weekly reviews of my calls for a month until the issue was resolved. My close rate improved by 15% within 6 weeks.",
    currentImprovement:
      "I'm working on improving my questioning techniques to uncover unstated objections earlier in the sales process. I'm reading 'Never Split the Difference', practicing labeling and mirroring techniques, and recording my calls to review how effectively I'm implementing these approaches.",

    // Section 5: Video Intro
    videoUrl: "https://www.loom.com/share/example12345",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    console.log("Saving profile data:", formData)
    // Handle save logic here
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
                <AvatarImage src="/placeholder.svg?height=96&width=96&query=abstract profile" />
                <AvatarFallback className="bg-purple-500/20 text-purple-400 text-2xl">JS</AvatarFallback>
              </Avatar>
              <AnimatedButton variant="outline" className="mt-4 text-sm">
                <Upload className="h-4 w-4 mr-2" />
                Change Photo
              </AnimatedButton>
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
        <div className="flex justify-end mt-8 mb-16">
          <AnimatedButton variant="purple" animation="glow" onClick={handleSave} icon={<Save className="w-4 h-4" />}>
            Save Changes
          </AnimatedButton>
        </div>
      </FadeIn>
    </div>
  )
}
