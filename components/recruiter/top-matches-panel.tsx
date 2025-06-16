"use client"

import { useState } from "react"
import { getTopMatchesForOpportunity } from "@/lib/getTopMatches"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Brain, Clock, UserPlus } from "lucide-react"
import { toast } from "sonner"

interface TopMatchesPanelProps {
  jobId: number
  jobTitle: string
}

export function TopMatchesPanel({ jobId, jobTitle }: TopMatchesPanelProps) {
  const [matches, setMatches] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [inviting, setInviting] = useState<{ [key: string]: boolean }>({})

  const fetchMatches = async () => {
    setLoading(true)
    try {
      const res = await getTopMatchesForOpportunity(jobId)
      setMatches(res.items)
    } catch (err) {
      toast.error("Failed to fetch top matches")
    } finally {
      setLoading(false)
    }
  }

  const sendInvite = async (userId: string) => {
    if (inviting[userId]) return
    setInviting(prev => ({ ...prev, [userId]: true }))
    try {
      const response = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repId: userId, jobId, jobDetails: { title: jobTitle } }),
      })
      if (!response.ok) throw new Error()
      toast.success("Invitation sent")
    } catch (err) {
      toast.error("Failed to send invite")
    } finally {
      setInviting(prev => ({ ...prev, [userId]: false }))
    }
  }

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase()

  return (
    <div className="mt-6 space-y-4">
      <Button onClick={fetchMatches} disabled={loading}>
        {loading ? (
          <>
            <Clock className="h-4 w-4 mr-2 animate-spin" /> Finding Top 5 Reps...
          </>
        ) : (
          <>
            <Brain className="h-4 w-4 mr-2" /> Find Top 5 Reps
          </>
        )}
      </Button>

      {matches && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map(rep => (
            <AnimatedCard key={rep.id} variant="hover-glow" className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={rep.avatar_url} />
                  <AvatarFallback>{getInitials(rep.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-medium">{rep.name}</p>
                  <p className="text-sm text-gray-400">Match Score: {rep.score}%</p>
                  {rep.reasons && rep.reasons.length > 0 && (
                    <ul className="text-xs text-gray-500 list-disc ml-4">
                      {rep.reasons.slice(0, 2).map((r: string, idx: number) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <Button size="sm" onClick={() => sendInvite(rep.id)} disabled={inviting[rep.id]}>
                {inviting[rep.id] ? (
                  <>
                    <Clock className="h-4 w-4 mr-1 animate-spin" /> Inviting...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-1" /> Send Invite
                  </>
                )}
              </Button>
            </AnimatedCard>
          ))}
        </div>
      )}
    </div>
  )
} 