"use client"

import { useState } from "react"
import { getTopMatchesForOpportunity } from "@/lib/getTopMatches"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Brain, Clock, UserPlus, Mail } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog"

interface TopMatchesPanelProps {
  jobId: number
  jobTitle: string
}

export function TopMatchesPanel({ jobId, jobTitle }: TopMatchesPanelProps) {
  const [matches, setMatches] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [inviting, setInviting] = useState<{ [key: string]: boolean }>({})
  const [selectedRep, setSelectedRep] = useState<any | null>(null)

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

  const closeDialog = () => setSelectedRep(null)

  const Card = ({ rep }: { rep: any }) => (
    <AnimatedCard
      key={rep.id}
      variant="hover-glow"
      className="p-4 flex items-center justify-between cursor-pointer hover:border-purple-500/50"
      onClick={() => setSelectedRep(rep)}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={rep.avatar_url} />
          <AvatarFallback>{getInitials(rep.name)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-white font-medium break-words max-w-[180px]">{rep.name}</p>
          <p className="text-sm text-gray-400">{rep.score}% match</p>
        </div>
      </div>
      <Button size="sm" onClick={(e) => { e.stopPropagation(); sendInvite(rep.id) }} disabled={inviting[rep.id]}>
        {inviting[rep.id] ? (
          <>
            <Clock className="h-4 w-4 mr-1 animate-spin" /> Inviting…
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4 mr-1" /> Invite
          </>
        )}
      </Button>
    </AnimatedCard>
  )

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
          {matches.map((rep) => (
            <Card key={rep.id} rep={rep} />
          ))}
        </div>
      )}

      {/* Rep details dialog */}
      {selectedRep && (
        <Dialog open={!!selectedRep} onOpenChange={closeDialog}>
          <DialogContent className="max-w-lg p-0 bg-background/95 backdrop-blur" onInteractOutside={closeDialog}>
            <div className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={selectedRep.avatar_url} />
                  <AvatarFallback>{getInitials(selectedRep.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-xl font-bold break-words">{selectedRep.name}</DialogTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 break-all">
                    <Mail className="h-4 w-4" /> {selectedRep.email || "No email"}
                  </div>
                  <p className="mt-2 text-gray-300 text-sm">AI Match Score: <span className="font-semibold">{selectedRep.score}%</span></p>
                  {selectedRep.reasons && (
                    <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-gray-400">
                      {selectedRep.reasons.map((r: string, idx: number) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border flex justify-end">
              <Button size="sm" onClick={() => sendInvite(selectedRep.id)} disabled={inviting[selectedRep.id]}>
                {inviting[selectedRep.id] ? <Clock className="h-4 w-4 mr-1 animate-spin" /> : <UserPlus className="h-4 w-4 mr-1" />}
                {inviting[selectedRep.id] ? "Sending…" : "Invite"}
              </Button>
              <DialogClose asChild>
                <Button variant="outline" size="sm" className="ml-2">Close</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 