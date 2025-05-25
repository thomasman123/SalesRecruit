"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { AnimatedInput } from "@/components/ui/animated-input"
import { Label } from "@/components/ui/label"
import { ArrowRight } from "lucide-react"
import { PageContainer } from "@/components/layout/page-container"
import { AppHeader } from "@/components/layout/app-header"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const access_token = searchParams.get("access_token")
    const refresh_token = searchParams.get("refresh_token")

    if (!access_token || !refresh_token) {
      toast({
        title: "Invalid reset link",
        description: "This password reset link is invalid or has expired.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    // Set the session with the tokens
    const supabase = getSupabaseClient()
    supabase.auth.setSession({ access_token, refresh_token })
      .then(() => {
        setIsValidToken(true)
      })
      .catch((error) => {
        console.error("Error setting session:", error)
        toast({
          title: "Invalid reset link",
          description: "This password reset link is invalid or has expired.",
          variant: "destructive",
        })
        router.push("/login")
      })
  }, [searchParams, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.updateUser({ password })
      
      if (error) throw error

      toast({
        title: "Password updated",
        description: "You can now sign in with your new password.",
      })
      router.push("/login")
    } catch (err: any) {
      toast({
        title: "Failed to reset password",
        description: err.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isValidToken) {
    return null
  }

  return (
    <PageContainer>
      <AppHeader />
      <div className="container max-w-md mx-auto py-12">
        <AnimatedCard variant="hover-glow" className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Reset Your Password</h1>
            <p className="text-gray-400">Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 text-sm">
                New Password
              </Label>
              <AnimatedInput
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password"
                variant="glow"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300 text-sm">
                Confirm Password
              </Label>
              <AnimatedInput
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                variant="glow"
                required
                minLength={6}
              />
            </div>

            <AnimatedButton
              type="submit"
              variant="purple"
              className="w-full"
              isLoading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Reset Password
            </AnimatedButton>
          </form>
        </AnimatedCard>
      </div>
    </PageContainer>
  )
} 