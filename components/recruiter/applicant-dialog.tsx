"use client"

import React, { useMemo } from "react"
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
import {
  Mail,
  MapPin,
  Brain,
  DollarSign,
  Target,
  Calendar,
  Briefcase,
  Video,
  CheckCircle,
  UserPlus,
  Clock,
  Wrench,
  FileText,
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

// Small subtitle text row with icon
const InfoRow = ({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) => (
  <div className="flex items-center gap-2 text-sm text-gray-400 break-words">
    {icon}
    {children}
  </div>
)

export function ApplicantDialog({
  applicant,
  open,
  onOpenChange,
  onInvite,
  isInviting = false,
}: ApplicantDialogProps) {
  const initials = useMemo(
    () =>
      applicant.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase(),
    [applicant.name]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden bg-background/95 backdrop-blur">
        {/* ---- Two-panel layout ---- */}
        <div className="flex flex-col md:flex-row h-[80vh]">
          {/* Left panel – summary */}
          <aside className="w-full shrink-0 md:w-80 bg-dark-800/60 p-8 space-y-8 flex flex-col">
            {/* Avatar & name */}
            <div className="flex flex-col items-center text-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={applicant.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <DialogTitle className="text-2xl font-bold break-words">
                {applicant.name}
              </DialogTitle>
            </div>

            {/* Contact & location */}
            <div className="space-y-2">
              <InfoRow icon={<Mail className="h-4 w-4" />}>{applicant.email}</InfoRow>
              <InfoRow icon={<MapPin className="h-4 w-4" />}>{applicant.location}</InfoRow>
            </div>

            <Separator />

            {/* AI SCORE */}
            {applicant.score !== null && applicant.score !== undefined && (
              <section className="space-y-4">
                <h3 className="flex items-center gap-2 font-semibold text-lg">
                  <Brain className="h-5 w-5" /> AI Match
                </h3>
                <div>
                  <div
                    className={`text-4xl font-extrabold ${scoreColor(
                      applicant.score
                    )}`}
                  >
                    {applicant.score}%
                  </div>
                  <Badge className={`${scoreBg(applicant.score)} mt-2`}>AI Score</Badge>
                </div>

                {applicant.score_reasons && applicant.score_reasons.length > 0 && (
                  <ScrollArea className="max-h-40 pr-2">
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-400">
                      {applicant.score_reasons.map((reason, idx) => (
                        <li
                          key={idx}
                          className="break-words whitespace-pre-wrap"
                        >
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                )}
              </section>
            )}

            {/* Invite button for not-invited reps */}
            {!applicant.invited && !applicant.hasScheduledInterview && (
              <Button
                onClick={() => onInvite(applicant)}
                disabled={!applicant.user_id || isInviting}
                className="mt-auto"
              >
                {isInviting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" /> Invite to Interview
                  </>
                )}
              </Button>
            )}
          </aside>

          {/* Right panel – detailed info */}
          <main className="flex-1 h-full overflow-hidden">
            <ScrollArea className="h-full p-8 pr-6">
              <div className="space-y-8">
                {/* OVERVIEW */}
                <section>
                  <SectionTitle icon={<Briefcase className="h-5 w-5" />}>Overview</SectionTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <OverviewRow
                      label="Sales Style"
                      icon={<Target className="h-4 w-4" />}
                      value={applicant.sales_style}
                    />
                    <OverviewRow
                      label="Highest Ticket Sale"
                      icon={<DollarSign className="h-4 w-4" />}
                      value={applicant.highest_ticket}
                    />
                    <OverviewRow
                      label="Applied"
                      icon={<Calendar className="h-4 w-4" />}
                      value={`${new Date(
                        applicant.applied_date
                      ).toLocaleDateString()} • ${formatDistanceToNow(
                        new Date(applicant.applied_date),
                        { addSuffix: true }
                      )}`}
                    />
                    <OverviewRow
                      label="Current Status"
                      icon={<Briefcase className="h-4 w-4" />}
                      value={
                        applicant.status.charAt(0).toUpperCase() +
                        applicant.status.slice(1)
                      }
                    />
                  </div>

                  {/* Interview scheduled */}
                  {applicant.hasScheduledInterview && applicant.scheduledInterview && (
                    <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-3 text-sm text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      Interview scheduled for {new Date(
                        applicant.scheduledInterview.scheduled_date
                      ).toLocaleDateString()} at {" "}
                      {applicant.scheduledInterview.scheduled_time}
                    </div>
                  )}
                </section>

                {/* EXPERIENCE */}
                {applicant.experience && (
                  <section>
                    <SectionTitle icon={<Briefcase className="h-5 w-5" />}>Experience</SectionTitle>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed bg-dark-700 p-4 rounded-lg">
                      {applicant.experience}
                    </p>
                  </section>
                )}

                {/* TOOLS */}
                {applicant.tools && (
                  <section>
                    <SectionTitle icon={<Wrench className="h-5 w-5" />}>Tools & CRM</SectionTitle>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed bg-dark-700 p-4 rounded-lg">
                      {applicant.tools}
                    </p>
                  </section>
                )}

                {/* NOTES */}
                {applicant.notes && (
                  <section>
                    <SectionTitle icon={<FileText className="h-5 w-5" />}>Notes</SectionTitle>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed bg-dark-700 p-4 rounded-lg">
                      {applicant.notes}
                    </p>
                  </section>
                )}

                {/* VIDEO */}
                {applicant.video_url && (
                  <section>
                    <Button
                      variant="outline"
                      onClick={() => window.open(applicant.video_url!, "_blank")}
                    >
                      <Video className="h-4 w-4 mr-2" /> Watch Introduction Video
                    </Button>
                  </section>
                )}
              </div>
            </ScrollArea>
          </main>
        </div>

        {/* Close button in footer (always) */}
        <DialogFooter className="p-4 border-t border-border bg-background/80">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---- Helper Components ----
interface OverviewRowProps {
  label: string
  icon: React.ReactNode
  value?: string | null
}

const OverviewRow = ({ label, icon, value }: OverviewRowProps) => {
  if (!value) return null
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
        {icon}
        <span>{label}</span>
      </div>
      <p className="pl-6 break-words whitespace-pre-wrap text-sm text-white">
        {value}
      </p>
    </div>
  )
}

const SectionTitle = ({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) => (
  <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
    {icon}
    {children}
  </h3>
) 