"use client"

import { useState, useEffect } from "react"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { AnimatedInput } from "@/components/ui/animated-input"
import { FadeIn } from "@/components/ui/fade-in"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Save, Upload } from "lucide-react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export default function RecruiterProfilePage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    title: "",
    bio: "",
    avatarUrl: "",
  })

  const [isUploading, setIsUploading] = useState(false)
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
            company: user.user_metadata?.company || "",
            title: user.user_metadata?.title || "",
            bio: user.user_metadata?.bio || "",
            avatarUrl: user.user_metadata?.avatar_url || "",
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
    setIsUploading(true)
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
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    try {
      const supabase = getSupabaseClient()

      const updates: any = {
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          full_name: `${formData.firstName} ${formData.lastName}`.trim(),
          phone: formData.phone,
          company: formData.company,
          title: formData.title,
          bio: formData.bio,
          avatar_url: formData.avatarUrl,
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
          <h1 className="text-3xl font-bold text-white">Recruiter Profile</h1>
        </div>
      </FadeIn>

      <FadeIn delay={200}>
        <AnimatedCard variant="hover-glow" className="p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="flex flex-col items-center">
              <Avatar className="h-24 w-24 border-2 border-purple-500/30">
                <AvatarImage src={formData.avatarUrl || "/placeholder.svg?height=96&width=96&query=abstract profile"} />
                <AvatarFallback className="bg-purple-500/20 text-purple-400 text-2xl">{`${formData.firstName?.[0] || ""}${formData.lastName?.[0] || ""}`}</AvatarFallback>
              </Avatar>
              <label className="mt-4 text-sm cursor-pointer flex items-center gap-2 text-purple-400 hover:text-purple-300">
                <Upload className="h-4 w-4" /> Change Photo
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={isUploading} />
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
                <Label htmlFor="company" className="text-gray-300 text-sm">
                  Company
                </Label>
                <AnimatedInput
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  variant="glow"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-300 text-sm">
                  Job Title
                </Label>
                <AnimatedInput
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  variant="glow"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-gray-300 text-sm">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  className="min-h-[100px] bg-dark-700 border-dark-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                  placeholder="Tell us about yourself and your recruiting experience..."
                />
              </div>
            </div>
          </div>
        </AnimatedCard>
      </FadeIn>

      <FadeIn delay={300}>
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