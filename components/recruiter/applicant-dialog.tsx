"use client"

import React, { useMemo, useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Mail,
  MapPin,
  Brain,
  ChevronDown,
  ChevronRight,
  UserPlus,
  Clock,
  Video,
  Briefcase,
  Target,
  Wrench,
  Heart,
  CheckCircle,
  Loader2,
} from "lucide-react"

// ---- Types ----
export interface ApplicantProfile {
  id: number
  name: string
  email: string
  location: string
  applied_date: string
  status: "new" | "reviewing" | "interviewing" | "hired" | "rejected"
  experience: string
  highest_ticket: string
  sales_style: string
  tools: string
  video_url?: string | null
  notes?: string | null
  avatar_url?: string | null
  user_id?: string | null
  score?: number | null
  score_reasons?: string[] | null
  invited?: boolean
  hasScheduledInterview?: boolean
  scheduledInterview?: {
    scheduled_date: string
    scheduled_time: string
  }
  // Onboarding answers from user_metadata
  role?: string | null
  highestTicket?: string | null
  salesProcess?: string | null
  crmExperience?: string | null
  whySales?: string | null
  videoUrl?: string | null
}

interface ApplicantDialogProps {
  applicant: ApplicantProfile
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvite: (applicant: ApplicantProfile) => void
  isInviting?: boolean
}

// ---- Helpers ----
const scoreColor = (score: number) => {
  if (score >= 80) return "text-green-500"
  if (score >= 60) return "text-yellow-500"
  if (score >= 40) return "text-orange-500"
  return "text-red-500"
}

const scoreBg = (score: number) => {
  if (score >= 80) return "bg-green-500/10 border-green-500/20"
  if (score >= 60) return "bg-yellow-500/10 border-yellow-500/20"
  if (score >= 40) return "bg-orange-500/10 border-orange-500/20"
  return "bg-red-500/10 border-red-500/20"
}

// Profile answer section with collapsible content
const ProfileSection = ({
  title,
  icon,
  answer,
  isOpen,
  onToggle,
  isLoading,
}: {
  title: string
  icon: React.ReactNode
  answer?: string | null
  isOpen: boolean
  onToggle: () => void
  isLoading?: boolean
}) => {
  if (isLoading) {
    return <Skeleton className="h-14 w-full" />
  }

  if (!answer) return null

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-4 rounded-lg bg-dark-700/50 hover:bg-dark-700 transition-colors border border-dark-600 hover:border-purple-500/50">
          <div className="flex items-center gap-3">
            {icon}
            <span className="font-medium text-white">{title}</span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 p-4 rounded-lg bg-dark-800/50 border border-dark-600">
          <p className="text-sm text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
            {answer}
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function ApplicantDialog({
  applicant,
  open,
  onOpenChange,
  onInvite,
  isInviting = false,
}: ApplicantDialogProps) {
  const [extendedData, setExtendedData] = useState<ApplicantProfile | null>(null)
  const [loading, setLoading] = useState(false)

  const initials = useMemo(
    () =>
      applicant.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase(),
    [applicant.name]
  )

  // State for managing which sections are open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    role: false,
    highest: false,
    process: false,
    crm: false,
    motivation: false,
  })

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // Fetch extended data when dialog opens
  useEffect(() => {
    if (open && applicant.user_id) {
      setLoading(true)
      fetch(`/api/applicants/${applicant.id}`)
        .then(res => res.json())
        .then(data => {
          setExtendedData(data)
        })
        .catch(error => {
          console.error('Failed to fetch extended applicant data:', error)
          setExtendedData(applicant) // Fallback to basic data
        })
        .finally(() => {
          setLoading(false)
        })
    } else if (open) {
      setExtendedData(applicant)
    }
  }, [open, applicant])

  // Helper function to format role display
  const formatRole = (role?: string | null) => {
    if (!role) return null
    switch (role) {
      case 'sdr':
        return 'SDR/Appointment Setter'
      case 'ae':
        return 'AE/Closer'
      default:
        return role
    }
  }

  const currentData = extendedData || applicant

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background/95 backdrop-blur">
        {/* ---- Header with basic info ---- */}
        <div className="p-6 border-b border-border">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={currentData.avatar_url || undefined} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-bold break-words mb-2">
                {currentData.name}
              </DialogTitle>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{currentData.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{currentData.location}</span>
                </div>
              </div>
              
              <div className="mt-2 text-sm text-gray-500">
                Applied {formatDistanceToNow(new Date(currentData.applied_date), { addSuffix: true })}
              </div>

              {/* Interview scheduled info */}
              {currentData.hasScheduledInterview && currentData.scheduledInterview && (
                <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Interview scheduled for {new Date(currentData.scheduledInterview.scheduled_date).toLocaleDateString()} 
                      at {currentData.scheduledInterview.scheduled_time}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* AI Score */}
            {currentData.score !== null && currentData.score !== undefined && (
              <div className="text-center">
                <div className={`text-3xl font-extrabold ${scoreColor(currentData.score)}`}>
                  {currentData.score}%
                </div>
                <Badge className={`${scoreBg(currentData.score)} mt-1`}>AI Score</Badge>
              </div>
            )}
          </div>
        </div>

        {/* ---- Scrollable content area ---- */}
        <ScrollArea className="max-h-[60vh] p-6">
          <div className="space-y-6">
            {/* Loading indicator */}
            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                <span className="ml-2 text-gray-400">Loading profile details...</span>
              </div>
            )}

            {/* AI Score Reasoning */}
            {currentData.score !== null && currentData.score !== undefined && currentData.score_reasons && currentData.score_reasons.length > 0 && (
              <section>
                <h3 className="flex items-center gap-2 font-semibold text-lg mb-3">
                  <Brain className="h-5 w-5" /> AI Match Reasoning
                </h3>
                <div className="bg-dark-700/50 border border-dark-600 rounded-lg p-4">
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    {currentData.score_reasons.map((reason, idx) => (
                      <li key={idx} className="break-words whitespace-pre-wrap">
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* Profile Questions */}
            <section>
              <h3 className="font-semibold text-lg mb-4 text-white">Profile Information</h3>
              <div className="space-y-3">
                <ProfileSection
                  title="Sales Role"
                  icon={<Briefcase className="h-4 w-4 text-blue-400" />}
                  answer={formatRole(currentData.role)}
                  isOpen={openSections.role}
                  onToggle={() => toggleSection('role')}
                  isLoading={loading}
                />

                <ProfileSection
                  title="Highest-Ticket Sale"
                  icon={<Target className="h-4 w-4 text-green-400" />}
                  answer={currentData.highestTicket}
                  isOpen={openSections.highest}
                  onToggle={() => toggleSection('highest')}
                  isLoading={loading}
                />

                <ProfileSection
                  title="Sales Process"
                  icon={<Target className="h-4 w-4 text-purple-400" />}
                  answer={currentData.salesProcess}
                  isOpen={openSections.process}
                  onToggle={() => toggleSection('process')}
                  isLoading={loading}
                />

                <ProfileSection
                  title="CRM Experience"
                  icon={<Wrench className="h-4 w-4 text-orange-400" />}
                  answer={currentData.crmExperience}
                  isOpen={openSections.crm}
                  onToggle={() => toggleSection('crm')}
                  isLoading={loading}
                />

                <ProfileSection
                  title="Why Sales?"
                  icon={<Heart className="h-4 w-4 text-red-400" />}
                  answer={currentData.whySales}
                  isOpen={openSections.motivation}
                  onToggle={() => toggleSection('motivation')}
                  isLoading={loading}
                />
              </div>
            </section>

            {/* Video Introduction */}
            {(currentData.videoUrl || currentData.video_url) && (
              <section>
                <h3 className="font-semibold text-lg mb-3 text-white">Video Introduction</h3>
                <Button
                  variant="outline"
                  onClick={() => window.open((currentData.videoUrl || currentData.video_url)!, "_blank")}
                  className="w-full"
                >
                  <Video className="h-4 w-4 mr-2" /> Watch Introduction Video
                </Button>
              </section>
            )}
          </div>
        </ScrollArea>

        {/* Footer with actions */}
        <div className="p-6 border-t border-border">
          <div className="flex justify-between items-center">
            {/* Invite Button */}
            {!currentData.invited && !currentData.hasScheduledInterview && (
              <Button
                onClick={() => onInvite(currentData)}
                disabled={!currentData.user_id || isInviting}
              >
                {isInviting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" /> Send Interview Invitation
                  </>
                )}
              </Button>
            )}

            {/* Close button */}
            <DialogClose asChild>
              <Button variant="outline" className="ml-auto">
                Close
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 