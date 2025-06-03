"use client"

import type React from "react"
import { useState } from "react"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Target, ArrowRight, Zap, Shield, TrendingUp, CheckCircle, Clock, Award, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

// Design system components
import { PageContainer } from "@/components/layout/page-container"
import { AppHeader } from "@/components/layout/app-header"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { AnimatedInput } from "@/components/ui/animated-input"
import { AnimatedIcon } from "@/components/ui/animated-icon"
import { FadeIn } from "@/components/ui/fade-in"

interface BaseHomepageProps {
  userType: 'recruiter' | 'sales-professional'
  headline: string
  subheadline?: string
}

export function BaseHomepage({ userType, headline, subheadline }: BaseHomepageProps) {
  const router = useRouter()
  const [signupData, setSignupData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: userType,
  })

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const { toast } = useToast()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = getSupabaseClient()

      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            first_name: signupData.firstName,
            last_name: signupData.lastName,
            role: signupData.role,
            full_name: `${signupData.firstName} ${signupData.lastName}`,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      if (data.user && data.user.id && data.user.email) {
        // Fire Facebook "SubmitApplication" event for recruiter signups
        if (signupData.role === 'recruiter' && typeof window !== 'undefined' && (window as any).fbq) {
          try {
            (window as any).fbq('track', 'SubmitApplication')
          } catch (err) {
            console.error('FBQ SubmitApplication error', err)
          }
        }

        toast({
          title: "Verification email sent",
          description: "Please check your email to verify your account before logging in.",
        })

        setSignupData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          role: userType,
        })
      }
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "Please check your information and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = getSupabaseClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      })

      if (error) throw error

      if (!data.user?.email_confirmed_at) {
        toast({
          title: "Email not verified",
          description: "Please check your email and verify your account before logging in.",
          variant: "destructive",
        })
        return
      }

      const role = data.user?.user_metadata?.role

      if (role === "recruiter") {
        router.push("/recruiter")
      } else {
        router.push("/dashboard")
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      })
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const features = userType === 'recruiter' ? [
    {
      icon: <Users className="h-6 w-6" />,
      title: "Pre-Vetted Talent",
      description: "Access a curated pool of sales professionals with verified track records and proven results.",
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Smart AI Matching",
      description: "Our algorithm matches candidates based on skills, experience, and cultural fit - not just keywords.",
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Time-Saving Process",
      description: "Reduce hiring time by 70% with automated screening and instant candidate availability.",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Placement Guarantee",
      description: "30-day guarantee on all placements. If they're not the right fit, we'll find you someone who is.",
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Performance Analytics",
      description: "Track hiring metrics and ROI with detailed analytics and performance insights.",
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: "Success-Based Pricing",
      description: "Only pay when you make a successful hire. No upfront costs or hidden fees.",
    },
  ] : [
    {
      icon: <Target className="h-6 w-6" />,
      title: "Multiple Opportunities",
      description: "Get matched with multiple companies simultaneously. No more waiting on one opportunity.",
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Transparent Compensation",
      description: "See salary ranges, commission structures, and full compensation details upfront.",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Direct Access",
      description: "Connect directly with hiring managers and decision makers - no middlemen.",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Privacy Protection",
      description: "Your current employer won't know you're looking. Complete discretion guaranteed.",
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Fast Process",
      description: "From application to offer in days, not weeks. Streamlined interviews and quick decisions.",
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: "Career Growth",
      description: "Get matched with companies that align with your career goals and growth trajectory.",
    },
  ]

  const stats = userType === 'recruiter' ? [
    { value: "72%", label: "Faster Hiring" },
    { value: "89%", label: "First-Year Retention" },
    { value: "$2.3M", label: "Average Deal Size" },
    { value: "5:1", label: "ROI on Hires" },
  ] : [
    { value: "15K+", label: "Open Positions" },
    { value: "$125K", label: "Average Base" },
    { value: "48hrs", label: "Response Time" },
    { value: "3.2x", label: "More Offers" },
  ]

  const faqs = userType === 'recruiter' ? [
    {
      question: "How much does it cost to post a job?",
      answer: "There are no upfront costs. We operate on a success-based model - you only pay when you successfully hire a candidate through our platform. Our fee is competitive and transparent."
    },
    {
      question: "How quickly can I expect to see candidates?",
      answer: "Most employers receive their first matched candidates within 24-48 hours of posting. Our AI works instantly to match your requirements with available talent."
    },
    {
      question: "What if the hire doesn't work out?",
      answer: "We offer a 30-day replacement guarantee. If your hire doesn't work out within the first 30 days, we'll find you a replacement at no additional cost."
    },
    {
      question: "Can I interview candidates before making a decision?",
      answer: "Absolutely. You have full control over the interview process. Schedule video calls, phone screens, or in-person meetings directly through our platform."
    },
  ] : [
    {
      question: "Is my job search confidential?",
      answer: "Yes, completely. Your profile is only visible to companies you express interest in. Your current employer will never know you're using our platform."
    },
    {
      question: "How many companies can I apply to?",
      answer: "There's no limit. Apply to as many opportunities as match your criteria. Our AI will help prioritize the best matches for your profile."
    },
    {
      question: "Do I need sales experience to join?",
      answer: "While most opportunities are for experienced sales professionals, we also have entry-level positions. Be honest about your experience level for the best matches."
    },
    {
      question: "How long does the process typically take?",
      answer: "Most candidates receive responses within 48 hours and complete the interview process within 1-2 weeks. Some have received offers in as little as 3 days."
    },
  ]

  return (
    <PageContainer>
      <AppHeader />

      {/* Hero Section */}
      <section className="py-20 px-6 relative overflow-hidden">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent" />
        
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Content */}
            <div>
              <FadeIn delay={0}>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight">
                  {headline.split(' ').map((word, i) => {
                    // Highlight key words
                    const highlightWords = ['AI', 'Wrong', 'Costs', 'Stuck', 'Waiting', 'Income']
                    const isHighlighted = highlightWords.some(hw => word.includes(hw))
                    
                    return (
                      <span key={i}>
                        {isHighlighted ? (
                          <span className="text-purple-400 bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">
                            {word}
                          </span>
                        ) : (
                          word
                        )}{' '}
                      </span>
                    )
                  })}
                </h1>
              </FadeIn>

              {subheadline && (
                <FadeIn delay={200}>
                  <p className="text-xl md:text-2xl mb-8 text-gray-300 leading-relaxed">
                    {subheadline}
                  </p>
                </FadeIn>
              )}

              <FadeIn delay={400}>
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <AnimatedButton
                    variant="purple"
                    size="lg"
                    icon={<ArrowRight className="w-5 h-5" />}
                    className="text-lg px-8 py-6"
                    onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Get Started
                  </AnimatedButton>
                  <Link href={userType === 'recruiter' ? '/rep' : '/hire'}>
                    <AnimatedButton
                      variant="outline"
                      size="lg"
                      className="text-lg px-8 py-6 border-purple-500/50 hover:border-purple-500 hover:bg-purple-500/10"
                    >
                      I'm a {userType === 'recruiter' ? 'Sales Rep' : 'Recruiter'}
                    </AnimatedButton>
                  </Link>
                </div>
              </FadeIn>
            </div>

            {/* Right side - Auth Forms */}
            <div id="auth-section" className="lg:pl-12">
              <FadeIn delay={600}>
                <div className="max-w-md mx-auto">
                  <Tabs defaultValue="signup" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-dark-700 p-1 shadow-lg shadow-black/20">
                      <TabsTrigger
                        value="signup"
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 rounded-md transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25"
                      >
                        Get started
                      </TabsTrigger>
                      <TabsTrigger
                        value="login"
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 rounded-md transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25"
                      >
                        Sign in
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="signup" className="mt-6">
                      <AnimatedCard variant="hover-glow" className="border-dark-600 bg-dark-800/50 backdrop-blur-sm">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-white text-xl">Create your account</CardTitle>
                          <CardDescription className="text-gray-400">
                            Join as a {userType === 'recruiter' ? 'Recruiter' : 'Sales Professional'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <form onSubmit={handleSignup} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor="first-name" className="text-gray-300 text-sm">
                                  First name
                                </Label>
                                <AnimatedInput
                                  id="first-name"
                                  placeholder="John"
                                  value={signupData.firstName}
                                  onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
                                  variant="glow"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="last-name" className="text-gray-300 text-sm">
                                  Last name
                                </Label>
                                <AnimatedInput
                                  id="last-name"
                                  placeholder="Doe"
                                  value={signupData.lastName}
                                  onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
                                  variant="glow"
                                  required
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="signup-email" className="text-gray-300 text-sm">
                                Work email
                              </Label>
                              <AnimatedInput
                                id="signup-email"
                                type="email"
                                placeholder="john@company.com"
                                value={signupData.email}
                                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                                variant="glow"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="signup-password" className="text-gray-300 text-sm">
                                Password
                              </Label>
                              <AnimatedInput
                                id="signup-password"
                                type="password"
                                placeholder="Create a password"
                                value={signupData.password}
                                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                                variant="glow"
                                required
                              />
                            </div>
                            <AnimatedButton
                              type="submit"
                              variant="purple"
                              icon={<ArrowRight className="w-4 h-4" />}
                              className="w-full mt-6"
                              disabled={isLoading}
                            >
                              {isLoading ? "Creating account..." : "Create account"}
                            </AnimatedButton>
                          </form>
                        </CardContent>
                      </AnimatedCard>
                    </TabsContent>

                    <TabsContent value="login" className="mt-6">
                      <AnimatedCard variant="hover-glow" className="border-dark-600 bg-dark-800/50 backdrop-blur-sm">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-white text-xl">Welcome back</CardTitle>
                          <CardDescription className="text-gray-400">Sign in to your account</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="login-email" className="text-gray-300 text-sm">
                                Email
                              </Label>
                              <AnimatedInput
                                id="login-email"
                                type="email"
                                placeholder="Enter your email"
                                value={loginData.email}
                                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                variant="glow"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="login-password" className="text-gray-300 text-sm">
                                Password
                              </Label>
                              <AnimatedInput
                                id="login-password"
                                type="password"
                                placeholder="Enter your password"
                                value={loginData.password}
                                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                variant="glow"
                                required
                              />
                            </div>
                            <AnimatedButton
                              type="submit"
                              variant="purple"
                              icon={<ArrowRight className="w-4 h-4" />}
                              className="w-full mt-6"
                              disabled={isLoading}
                            >
                              {isLoading ? "Signing in..." : "Sign in"}
                            </AnimatedButton>
                          </form>
                        </CardContent>
                      </AnimatedCard>
                    </TabsContent>
                  </Tabs>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 relative">
        <div className="container mx-auto">
          <FadeIn delay={0}>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                The Smart, Fair, and{" "}
                <span className="text-purple-400 bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">
                  Superior Way
                </span>{" "}
                to {userType === 'recruiter' ? 'Hire' : 'Get Hired'}
              </h2>
              <p className="text-gray-400 text-lg max-w-3xl mx-auto">
                {userType === 'recruiter' 
                  ? "Everything you need to build a world-class sales team, powered by AI and designed for results."
                  : "Take control of your career with transparency, multiple opportunities, and a process that respects your time."
                }
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FadeIn key={feature.title} delay={100 * (index + 1)}>
                <AnimatedCard 
                  variant="interactive" 
                  className="p-8 h-full group border-dark-600 bg-dark-800/30 hover:bg-dark-800/50 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/20 transition-all duration-300 group-hover:scale-110">
                      <AnimatedIcon variant="scale" size="md" className="text-purple-400">
                        {feature.icon}
                      </AnimatedIcon>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-purple-400 transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-gray-400 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </AnimatedCard>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-dark-800/50 to-transparent relative">
        <div className="container mx-auto">
          <FadeIn delay={0}>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Numbers that{" "}
                <span className="text-purple-400">speak for themselves</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                {userType === 'recruiter' 
                  ? "Join hundreds of companies making better hires, faster."
                  : "Join thousands of sales professionals landing better opportunities."
                }
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <FadeIn key={stat.label} delay={100 * (index + 1)}>
                <AnimatedCard variant="hover-glow" className="p-8 text-center group border-dark-600 bg-dark-800/30">
                  <div className="text-5xl font-bold mb-2 text-white group-hover:text-purple-400 transition-all duration-300">
                    <span className="font-mono bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">
                      {stat.value}
                    </span>
                  </div>
                  <div className="text-gray-400">{stat.label}</div>
                </AnimatedCard>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Plan Section removed for recruiters */}
      {userType === 'sales-professional' && (
        <section className="py-24 px-6">
          <div className="container mx-auto max-w-4xl">
            <FadeIn delay={0}>
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-white mb-4">
                  One Plan, <span className="text-purple-400">Total Access</span>
                </h2>
                <p className="text-gray-400 text-lg">
                  Simple, transparent pricing with no hidden fees
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={200}>
              <AnimatedCard variant="hover-glow" className="p-8 lg:p-12 border-purple-500/20 bg-gradient-to-br from-dark-800 to-dark-800/50">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-5xl font-bold text-white">
                        Free
                      </span>
                    </div>
                    <p className="text-xl text-gray-300 mb-8">
                      For sales professionals, always free
                    </p>
                    <AnimatedButton
                      variant="purple"
                      size="lg"
                      icon={<ArrowRight className="w-5 h-5" />}
                      className="w-full sm:w-auto"
                      onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      Get started now
                    </AnimatedButton>
                  </div>

                  <div className="space-y-4">
                    {["Apply to unlimited positions",
                      "See all compensation details",
                      "Direct recruiter messaging",
                      "Interview scheduling tools",
                      "Profile analytics",
                      "Job match notifications",
                      "Career coaching resources",
                      "Salary negotiation tools",].map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </AnimatedCard>
            </FadeIn>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-3xl">
          <FadeIn delay={0}>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                Common <span className="text-purple-400">Questions</span>
              </h2>
              <p className="text-gray-400 text-lg">
                Everything you need to know about {userType === 'recruiter' ? 'hiring' : 'finding your next role'}
              </p>
            </div>
          </FadeIn>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FadeIn key={index} delay={100 * (index + 1)}>
                <AnimatedCard 
                  variant="interactive" 
                  className="overflow-hidden border-dark-600 bg-dark-800/30 hover:bg-dark-800/50"
                >
                  <button
                    className="w-full p-6 text-left flex items-center justify-between group"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors duration-300">
                      {faq.question}
                    </h3>
                    <ChevronDown 
                      className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                        openFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-6">
                      <p className="text-gray-400 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </AnimatedCard>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-purple-500/10" />
        <div className="container mx-auto text-center relative z-10">
          <FadeIn delay={0}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to {userType === 'recruiter' ? 'build your dream team' : 'accelerate your career'}?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of {userType === 'recruiter' ? 'companies' : 'sales professionals'} already using Helios Recruit
            </p>
            <AnimatedButton
              variant="purple"
              size="lg"
              icon={<ArrowRight className="w-5 h-5" />}
              className="text-lg px-8 py-6"
              onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Get Started
            </AnimatedButton>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-dark-600">
        <div className="container mx-auto">
          <div className="flex items-center justify-center space-x-3 mb-8 group">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-all duration-300 group-hover:scale-110">
              <Target className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-white group-hover:text-purple-400 transition-colors duration-300">
              Helios<span className="font-mono text-purple-400">Recruit</span>
            </span>
          </div>

          <div className="text-center">
            <p className="text-gray-400 mb-6">
              The modern platform for sales recruitment
            </p>
            <div className="flex justify-center space-x-8 text-sm">
              {["Privacy", "Terms", "Contact", "Blog"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-gray-400 hover:text-white transition-all duration-300 relative group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-dark-700 text-center text-sm text-gray-500">
            © 2024 Helios Recruit. All rights reserved.
          </div>
        </div>
      </footer>
    </PageContainer>
  )
} 