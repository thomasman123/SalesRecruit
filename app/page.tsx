"use client"

import type React from "react"

import { useState } from "react"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Target, ArrowRight, Zap, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

// New design system components
import { PageContainer } from "@/components/layout/page-container"
import { AppHeader } from "@/components/layout/app-header"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { AnimatedInput } from "@/components/ui/animated-input"
import { AnimatedIcon } from "@/components/ui/animated-icon"
import { FadeIn } from "@/components/ui/fade-in"

export default function HomePage() {
  const router = useRouter()
  const [signupData, setSignupData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "",
  })

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })

  const [isLoading, setIsLoading] = useState(false)
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

      if (data.user) {
        toast({
          title: "Verification email sent",
          description: "Please check your email to verify your account before logging in..",
        })

        // Clear form
        setSignupData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          role: "",
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

      // Determine user role from metadata
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

  return (
    <PageContainer>
      <AppHeader />

      {/* Hero Section */}
      <section className="py-24 px-6 relative">
        <div className="container mx-auto text-center max-w-4xl">
          <FadeIn delay={0}>
            <div className="mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 backdrop-blur-sm shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300 hover:scale-105">
                <AnimatedIcon variant="pulse" size="sm" className="mr-1">
                  <Zap className="w-3 h-3" />
                </AnimatedIcon>
                Now in Beta
              </span>
            </div>
          </FadeIn>

          <FadeIn delay={200}>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-white leading-tight">
              Connect sales talent
              <br />
              with{" "}
              <span className="text-purple-400 bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">
                opportunity
              </span>
            </h2>
          </FadeIn>

          <FadeIn delay={400}>
            <p className="text-xl mb-12 text-gray-400 max-w-2xl mx-auto leading-relaxed">
              The modern platform for sales recruitment. Built for professionals who value{" "}
              <span className="font-mono text-purple-400 hover:text-purple-300 transition-colors duration-300">
                efficiency
              </span>{" "}
              and{" "}
              <span className="font-mono text-purple-400 hover:text-purple-300 transition-colors duration-300">
                results
              </span>
              .
            </p>
          </FadeIn>

          {/* Auth Forms */}
          <FadeIn delay={600}>
            <div className="max-w-md mx-auto">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-dark-700 p-1 shadow-lg shadow-black/20">
                  <TabsTrigger
                    value="login"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 rounded-md transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25"
                  >
                    Sign in
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 rounded-md transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25"
                  >
                    Get started
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-6">
                  <AnimatedCard variant="hover-glow">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-white text-lg">Welcome back</CardTitle>
                      <CardDescription className="text-gray-400 text-sm">Sign in to your account</CardDescription>
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
                          animation="glow"
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

                <TabsContent value="signup" className="mt-6">
                  <AnimatedCard variant="hover-glow">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-white text-lg">Create your account</CardTitle>
                      <CardDescription className="text-gray-400 text-sm">Join the platform today</CardDescription>
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
                            Email
                          </Label>
                          <AnimatedInput
                            id="signup-email"
                            type="email"
                            placeholder="Enter your email"
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
                        <div className="space-y-2">
                          <Label htmlFor="role" className="text-gray-300 text-sm">
                            I am a...
                          </Label>
                          <Select onValueChange={(value) => setSignupData({ ...signupData, role: value })} required>
                            <SelectTrigger className="border-dark-600 bg-dark-700 text-white focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 hover:border-purple-500/50">
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                            <SelectContent className="bg-dark-700 border-dark-600">
                              <SelectItem
                                value="sales-professional"
                                className="text-white hover:bg-dark-600 transition-colors duration-200"
                              >
                                Sales Professional
                              </SelectItem>
                              <SelectItem
                                value="recruiter"
                                className="text-white hover:bg-dark-600 transition-colors duration-200"
                              >
                                Recruiter
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <AnimatedButton
                          type="submit"
                          variant="purple"
                          animation="glow"
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
              </Tabs>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="container mx-auto">
          <FadeIn delay={0}>
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-white mb-4">
                Built for modern{" "}
                <span className="font-mono text-purple-400 bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">
                  recruitment
                </span>
              </h3>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Everything you need to connect talent with opportunity, designed with simplicity and power in mind.
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            <FadeIn delay={200}>
              <AnimatedCard variant="interactive" className="p-8 group">
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-all duration-300">
                  <AnimatedIcon variant="scale" size="md">
                    <Users className="h-6 w-6" />
                  </AnimatedIcon>
                </div>
                <h4 className="text-xl font-semibold mb-3 text-white group-hover:text-purple-400 transition-colors duration-300">
                  Verified Network
                </h4>
                <p className="text-gray-400 leading-relaxed">
                  Access to{" "}
                  <span className="font-mono text-purple-400 hover:text-purple-300 transition-colors duration-300">
                    10,000+
                  </span>{" "}
                  verified sales professionals and experienced recruiters.
                </p>
              </AnimatedCard>
            </FadeIn>

            <FadeIn delay={400}>
              <AnimatedCard variant="interactive" className="p-8 group">
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-all duration-300">
                  <AnimatedIcon variant="scale" size="md">
                    <Target className="h-6 w-6" />
                  </AnimatedIcon>
                </div>
                <h4 className="text-xl font-semibold mb-3 text-white group-hover:text-purple-400 transition-colors duration-300">
                  Smart Matching
                </h4>
                <p className="text-gray-400 leading-relaxed">
                  AI-powered algorithms that understand context and match the right talent with the right opportunities.
                </p>
              </AnimatedCard>
            </FadeIn>

            <FadeIn delay={600}>
              <AnimatedCard variant="interactive" className="p-8 group">
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-all duration-300">
                  <AnimatedIcon variant="scale" size="md">
                    <Shield className="h-6 w-6" />
                  </AnimatedIcon>
                </div>
                <h4 className="text-xl font-semibold mb-3 text-white group-hover:text-purple-400 transition-colors duration-300">
                  Privacy First
                </h4>
                <p className="text-gray-400 leading-relaxed">
                  Your data is protected with enterprise-grade security and complete transparency in how it's used.
                </p>
              </AnimatedCard>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 border-y border-dark-600 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent" />
        <div className="container mx-auto relative">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: "10K+", label: "Sales Professionals" },
              { value: "500+", label: "Active Recruiters" },
              { value: "95%", label: "Match Success Rate" },
              { value: "<24h", label: "Avg Response Time" },
            ].map((stat, index) => (
              <FadeIn key={stat.label} delay={index * 100}>
                <div className="group hover:scale-105 transition-transform duration-300">
                  <div className="text-4xl font-bold mb-2 text-white group-hover:text-purple-400 transition-colors duration-300">
                    <span className="font-mono">{stat.value}</span>
                  </div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-center space-x-3 mb-8 group">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-md flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-all duration-300 group-hover:scale-110">
              <Target className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white group-hover:text-purple-400 transition-colors duration-300">
              Helios<span className="font-mono text-purple-400"> Recruit</span>
            </span>
          </div>

          <div className="text-center">
            <p className="text-gray-400 mb-6 text-sm">
              Connecting sales talent with opportunity since <span className="font-mono text-purple-400">2024</span>
            </p>
            <div className="flex justify-center space-x-8 text-sm">
              {["Privacy", "Terms", "Contact"].map((item) => (
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
        </div>
      </footer>
    </PageContainer>
  )
}
