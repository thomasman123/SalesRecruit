"use client"

// Updated, fully-themed recruiter ‑ messages experience that reuses our shared UI primitives (AnimatedCard, Badge, Button, Input, etc.)
// The whole page has been rebuilt with Tailwind classes instead of inline styles so that colours, fonts and elevations stay consistent with the
// dashboard/network pages.  All business logic (Supabase queries, websockets, etc.) is kept from the previous version but the JSX structure and
// styling are now completely new.

export const dynamic = "force-dynamic"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { formatDistanceToNow } from "date-fns"

import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FadeIn } from "@/components/ui/fade-in"

import { useUser } from "@/lib/hooks/use-user"
import { getSupabaseClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  Eye,
  MessageSquare,
  Target,
  User,
  Wrench,
} from "lucide-react"

// Type modelling -----------------------------------------------------------------------------
interface Message {
  id: number
  content: string
  sender_type: "recruiter" | "applicant"
  timestamp: string
  read: boolean
}

interface Conversation {
  id: number
  participant: {
    name: string
    avatar_url: string | null
  }
  job: {
    title: string
  }
  last_message_timestamp: string
  unread_count: number
}

interface Applicant {
  id: number
  name: string
  email: string
  avatar_url: string | null
  location: string
  experience: string
  highest_ticket: string
  sales_style: string
  tools: string
  video_url: string | null
  applied_date: string
  status: string
  user_id: string | null
  job: {
    id: number
    title: string
  }
}

// Helper -------------------------------------------------------------------------------------
const statusColours: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-400",
  reviewing: "bg-yellow-500/10 text-yellow-400",
  interviewing: "bg-purple-500/10 text-purple-400",
  hired: "bg-green-500/10 text-green-400",
  rejected: "bg-red-500/10 text-red-400",
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn(statusColours[status] ?? "", "border-transparent")}>{status?.charAt(0).toUpperCase() + status.slice(1)}</Badge>
  )
}

// Page ---------------------------------------------------------------------------------------
export default function RecruiterMessagesPage() {
  // State management -------------------------------------------------------------------------
  const { userData, isLoading } = useUser()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [availableApplicants, setAvailableApplicants] = useState<Applicant[]>([])
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null)
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [view, setView] = useState<"conversations" | "applicants" | "profile">("conversations")
  const [searchQuery, setSearchQuery] = useState("")

  const supabase = getSupabaseClient()

  // Initial data fetch -----------------------------------------------------------------------
  useEffect(() => {
    if (!isLoading && userData) {
      fetchConversations()
      fetchAvailableApplicants()
    }
  }, [isLoading, userData])

  // Realtime messages ------------------------------------------------------------------------
  useEffect(() => {
    if (!selectedConversation) return

    fetchMessages(selectedConversation)

    const channel = supabase
      .channel(`messages:${selectedConversation}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversation}`,
        },
        (payload) => {
          const newMsg: Message = {
            id: payload.new.id as number,
            content: payload.new.content as string,
            sender_type: payload.new.sender_type as "recruiter" | "applicant",
            timestamp: payload.new.timestamp as string,
            read: payload.new.read as boolean,
          }
          setMessages((prev) => [...prev, newMsg])
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation])

  // Keep URL param ?c in sync --------------------------------------------------------------
  function ParamSync() {
    const sp = useSearchParams()
    useEffect(() => {
      const c = sp.get("c")
      if (c && conversations.length) {
        const cid = Number(c)
        if (!isNaN(cid)) setSelectedConversation(cid)
      }
    }, [sp, conversations])
    return null
  }

  // Queries ----------------------------------------------------------------------------------
  async function fetchConversations() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("conversations")
      .select(
        `id, participant:users!conversations_applicant_user_id_fkey(name, avatar_url), job:jobs(title), last_message_timestamp, unread_count`,
      )
      .eq("recruiter_id", user.id)
      .order("last_message_timestamp", { ascending: false })

    if (error) {
      console.error("Error fetching conversations", error)
      return
    }

    const transformed: Conversation[] = (data || []).map((conv: any) => ({
      id: conv.id,
      participant: {
        name: conv.participant?.name ?? "",
        avatar_url: conv.participant?.avatar_url ?? null,
      },
      job: { title: conv.job?.title ?? "" },
      last_message_timestamp: conv.last_message_timestamp,
      unread_count: conv.unread_count,
    }))

    setConversations(transformed)
  }

  async function fetchAvailableApplicants() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("applicants")
      .select(
        `id,name,email,avatar_url,location,experience,highest_ticket,sales_style,tools,video_url,applied_date,status,user_id,job:jobs!inner(id,title,recruiter_id)`,
      )
      .eq("jobs.recruiter_id", user.id)
      .order("applied_date", { ascending: false })

    if (error) {
      console.error("Error fetching applicants", error)
      return
    }

    const transformed: Applicant[] = (data || []).map((a: any) => ({
      ...a,
      job: { id: a.job.id, title: a.job.title },
    }))

    setAvailableApplicants(transformed)
  }

  async function fetchMessages(conversationId: number) {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("timestamp", { ascending: true })

    if (error) {
      console.error("Error fetching messages", error)
      return
    }

    const transformed: Message[] = (data || []).map((m: any) => ({
      id: m.id,
      content: m.content,
      sender_type: m.sender_type,
      timestamp: m.timestamp,
      read: m.read,
    }))

    setMessages(transformed)

    await supabase.from("conversations").update({ unread_count: 0 }).eq("id", conversationId)
  }

  async function startConversation(applicant: Applicant) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || !applicant.user_id) return

    // Check if exists -----------------------------------------------------------------------
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("recruiter_id", user.id)
      .eq("applicant_user_id", applicant.user_id)
      .eq("job_id", applicant.job.id)
      .single()

    if (existing) {
      setSelectedConversation(existing.id)
      setView("conversations")
      return
    }

    // Create new conversation ---------------------------------------------------------------
    const { data: created, error } = await supabase
      .from("conversations")
      .insert({
        recruiter_id: user.id,
        applicant_id: applicant.id,
        applicant_user_id: applicant.user_id,
        job_id: applicant.job.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating conversation", error)
      return
    }

    setSelectedConversation(created.id)
    setView("conversations")
    fetchConversations()
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedConversation) return

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const messageContent = newMessage.trim()
    setNewMessage("")

    const temp: Message = {
      id: Date.now(),
      content: messageContent,
      sender_type: "recruiter",
      timestamp: new Date().toISOString(),
      read: true,
    }
    setMessages((curr) => [...curr, temp])

    const { error } = await supabase.from("messages").insert({
      conversation_id: selectedConversation,
      sender_id: user.id,
      sender_type: "recruiter",
      content: messageContent,
    })

    if (error) {
      console.error("Error sending message", error)
      setMessages((curr) => curr.filter((m) => m.id !== temp.id))
      setNewMessage(messageContent)
    } else {
      fetchConversations()
    }
  }

  // Derived ---------------------------------------------------------------------------------
  const filteredApplicants = availableApplicants.filter((a) =>
    searchQuery ? a.name.toLowerCase().includes(searchQuery.toLowerCase()) : true,
  )

  // UI Components ----------------------------------------------------------------------------
  const ConversationItem = ({ conversation }: { conversation: Conversation }) => {
    const selected = selectedConversation === conversation.id
    return (
      <AnimatedCard
        glowColor="purple"
        variant="interactive"
        className={cn(
          "flex items-center gap-3 p-4",
          selected && "border-purple-500/40 shadow-purple-500/10 bg-dark-700",
        )}
        onClick={() => setSelectedConversation(conversation.id)}
      >
        <Avatar className="border border-dark-600">
          <AvatarImage src={conversation.participant.avatar_url || ""} />
          <AvatarFallback className="bg-purple-500/20 text-purple-400">
            {conversation.participant.name.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-white">{conversation.participant.name}</p>
          <p className="text-sm text-gray-400 truncate">{conversation.job.title}</p>
        </div>

        <div className="text-right space-y-1">
          <p className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(conversation.last_message_timestamp), {
              addSuffix: true,
            })}
          </p>
          {conversation.unread_count > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-purple-500 rounded-full">
              {conversation.unread_count}
            </span>
          )}
        </div>
      </AnimatedCard>
    )
  }

  const ApplicantItem = ({ applicant }: { applicant: Applicant }) => (
    <AnimatedCard
      glowColor="purple"
      variant="interactive"
      className="p-4 space-y-3"
    >
      <div className="flex items-center gap-3">
        <Avatar className="border border-dark-600">
          <AvatarImage src={applicant.avatar_url || ""} />
          <AvatarFallback className="bg-purple-500/20 text-purple-400">
            {applicant.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-white">{applicant.name}</p>
          <p className="text-sm text-gray-400 truncate">{applicant.job.title}</p>
          <p className="text-xs text-gray-500 truncate">{applicant.location}</p>
        </div>
        <StatusBadge status={applicant.status} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <AnimatedButton
          variant="ghost"
          size="sm"
          className="border border-dark-600 text-gray-400 hover:border-purple-500 hover:text-white"
          onClick={() => {
            setSelectedApplicant(applicant)
            setView("profile")
          }}
        >
          <Eye className="w-4 h-4 mr-1" /> View
        </AnimatedButton>
        <AnimatedButton variant="purple" size="sm" onClick={() => startConversation(applicant)}>
          <MessageSquare className="w-4 h-4 mr-1" /> Message
        </AnimatedButton>
      </div>
    </AnimatedCard>
  )

  // Main render -----------------------------------------------------------------------------
  if (view === "profile" && selectedApplicant) {
    return (
      <div className="h-[calc(100vh-8rem)] overflow-y-auto px-4 py-6 container mx-auto">
        <FadeIn>
          <Button
            onClick={() => setView("applicants")}
            variant="ghost"
            className="mb-6 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Candidates
          </Button>

          <AnimatedCard className="p-8 space-y-8">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border border-dark-600">
                  <AvatarImage src={selectedApplicant.avatar_url || ""} />
                  <AvatarFallback className="bg-purple-500/20 text-purple-400 text-xl">
                    {selectedApplicant.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{selectedApplicant.name}</h2>
                  <p className="text-gray-400 mb-1">{selectedApplicant.location}</p>
                  <p className="text-xs text-gray-500">Applied for: {selectedApplicant.job.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <AnimatedButton variant="purple" size="sm" onClick={() => startConversation(selectedApplicant)}>
                  <MessageSquare className="w-4 h-4 mr-2" /> Message
                </AnimatedButton>
                <StatusBadge status={selectedApplicant.status} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <p className="flex items-center text-sm text-gray-400 gap-2">
                <Briefcase className="w-4 h-4 text-purple-400" /> {selectedApplicant.experience}
              </p>
              <p className="flex items-center text-sm text-gray-400 gap-2">
                <DollarSign className="w-4 h-4 text-purple-400" /> Highest ticket: {selectedApplicant.highest_ticket}
              </p>
              <p className="flex items-center text-sm text-gray-400 gap-2">
                <Target className="w-4 h-4 text-purple-400" /> Style: {selectedApplicant.sales_style}
              </p>
              <p className="flex items-center text-sm text-gray-400 gap-2">
                <Wrench className="w-4 h-4 text-purple-400" /> Tools: {selectedApplicant.tools}
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Experience</h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {selectedApplicant.experience}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Sales Style</h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {selectedApplicant.sales_style}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Tools & Skills</h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">{selectedApplicant.tools}</p>
              </div>
            </div>
          </AnimatedCard>
        </FadeIn>
      </div>
    )
  }

  // Conversations / Candidates view ------------------------------------------------------------
  return (
    <div className="h-[calc(100vh-8rem)] overflow-hidden">
      <Suspense>
        <ParamSync />
      </Suspense>

      <div className="grid grid-cols-12 gap-4 h-full">
        {/* Sidebar -------------------------------------------------------------------------*/}
        <div className="col-span-4 border-r border-dark-600 pr-4 flex flex-col h-full">
          {/* Header with tabs */}
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h2 className="text-2xl font-bold text-white">Messages</h2>
            <div className="inline-flex gap-2">
              <Button
                size="sm"
                variant={view === "conversations" ? "default" : "ghost"}
                className={cn(
                  view !== "conversations" && "bg-transparent border-dark-600 text-gray-400 hover:bg-dark-700",
                )}
                onClick={() => setView("conversations")}
              >
                Chats
              </Button>
              <Button
                size="sm"
                variant={view === "applicants" ? "default" : "ghost"}
                className={cn(view !== "applicants" && "bg-transparent border-dark-600 text-gray-400 hover:bg-dark-700")}
                onClick={() => setView("applicants")}
              >
                Candidates
              </Button>
            </div>
          </div>

          {view === "applicants" && (
            <Input
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-4 bg-dark-700 border-dark-600 text-white placeholder:text-gray-500"
            />
          )}

          {/* Scrollable list */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-2 pr-2 pb-6">
              {view === "conversations" ? (
                conversations.length ? (
                  conversations.map((c) => <ConversationItem key={c.id} conversation={c} />)
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No conversations yet</h3>
                    <p className="text-gray-400">Start messaging candidates by switching to the Candidates tab</p>
                  </div>
                )
              ) : filteredApplicants.length ? (
                filteredApplicants.map((a) => <ApplicantItem key={a.id} applicant={a} />)
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No candidates found</h3>
                  <p className="text-gray-400">
                    {searchQuery ? "No candidates match your search criteria" : "You don't have any candidates yet"}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat panel ---------------------------------------------------------------------------*/}
        <div className="col-span-8 flex flex-col h-full min-h-0">
          {selectedConversation ? (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 min-h-0 mb-4">
                <div className="p-4 space-y-4">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn("flex", m.sender_type === "recruiter" ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[75%] rounded-lg p-3 text-sm",
                          m.sender_type === "recruiter"
                            ? "bg-purple-500 text-white"
                            : "bg-dark-700 text-white border border-dark-600",
                        )}
                      >
                        <p>{m.content}</p>
                        <p className="text-[10px] mt-1 opacity-70">
                          {formatDistanceToNow(new Date(m.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="flex gap-2 flex-shrink-0">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  className="bg-dark-700 border-dark-600 text-white placeholder:text-gray-500"
                />
                <Button onClick={sendMessage} className="bg-purple-500 hover:bg-purple-600">
                  Send
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">
                  {view === "conversations"
                    ? "Select a conversation to start messaging"
                    : "Select a candidate to view their profile or start messaging"}
                </h3>
                <p className="text-gray-400">
                  {view === "conversations"
                    ? "Switch to the Candidates tab to start new conversations"
                    : "Choose from the list on the left to get started"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
