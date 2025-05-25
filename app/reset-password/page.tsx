"use client"

import React, { useState } from "react"

import { getSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
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
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.updateUser({ password })
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

  return (
    <PageContainer>
      <AppHeader />
      <section className="py-24 px-6 flex justify-center">
        <AnimatedCard variant="hover-glow" className="max-w-md w-full">
          <form onSubmit={handleSubmit} className="p-8 space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Reset your password</h2>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <AnimatedInput
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="glow"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <AnimatedInput
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {isLoading ? "Updating..." : "Update password"}
            </AnimatedButton>
          </form>
        </AnimatedCard>
      </section>
    </PageContainer>
  )
} 