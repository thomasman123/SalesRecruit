"use client"

import { useState, useEffect } from "react"
import { AnimatedCard } from "@/components/ui/animated-card"
import { FadeIn } from "@/components/ui/fade-in"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Send, Calendar, MapPin } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { createSupabaseClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"

interface Conversation {
  id: number
  applicant_id: number
  job_id: number
  last_message_timestamp: string
  unread_count: number
  applicant: {
    id: number
    name: string
    email: string
    location: string
    avatar_url?: string
  }
  job: {
    id: number
    title: string
  }
}

interface Message {
  id: number
  conversation_id: number
  sender_id: string
  sender_type: "recruiter" | "applicant"
  content: string
  timestamp: string
  read: boolean
}

export function MessagesContent() {
  const searchParams = useSearchParams()
  const requestedApplicantId = searchParams.get("applicant")
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>("")

  useEffect(() => {
    loadConversations()
    getCurrentUser()
  }, [])

  useEffect(() => {
    if (requestedApplicantId && conversations.length > 0) {
      const conversation = conversations.find(c => c.applicant_id === parseInt(requestedApplicantId))
      if (conversation) {
        setSelectedConversation(conversation)
      }
    }
  }, [requestedApplicantId, conversations])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
      markMessagesAsRead(selectedConversation.id)
    }
  }, [selectedConversation])

  const getCurrentUser = async () => {
    const supabase = createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
    }
  }

  const loadConversations = async () => {
    setIsLoading(true)
    const supabase = createSupabaseClient()
    
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        *,
        applicant:applicants!conversations_applicant_id_fkey(id, name, email, location, avatar_url),
        job:jobs!conversations_job_id_fkey(id, title)
      `)
      .order("last_message_timestamp", { ascending: false })

    if (error) {
      console.error("Error loading conversations:", error)
      toast.error("Failed to load conversations")
    } else {
      setConversations(data || [])
    }
    
    setIsLoading(false)
  }

  const loadMessages = async (conversationId: number) => {
    const supabase = createSupabaseClient()
    
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("timestamp", { ascending: true })

    if (error) {
      console.error("Error loading messages:", error)
      toast.error("Failed to load messages")
    } else {
      setMessages(data || [])
    }
  }

  const markMessagesAsRead = async (conversationId: number) => {
    const supabase = createSupabaseClient()
    
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("conversation_id", conversationId)
      .eq("sender_type", "applicant")
      .eq("read", false)

    // Update local state
    setConversations(conversations.map(c => 
      c.id === conversationId ? { ...c, unread_count: 0 } : c
    ))
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return

    setIsSending(true)
    const supabase = createSupabaseClient()
    
    const messageData = {
      conversation_id: selectedConversation.id,
      sender_id: currentUserId,
      sender_type: "recruiter" as const,
      content: newMessage.trim(),
      read: false
    }

    const { data, error } = await supabase
      .from("messages")
      .insert(messageData)
      .select()
      .single()

    if (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } else {
      setMessages([...messages, data])
      setNewMessage("")
      
      // Update conversation's last message timestamp
      await supabase
        .from("conversations")
        .update({ last_message_timestamp: data.timestamp })
        .eq("id", selectedConversation.id)

      // Update local conversation state
      setConversations(conversations.map(c =>
        c.id === selectedConversation.id
          ? { ...c, last_message_timestamp: data.timestamp }
          : c
      ))
    }
    
    setIsSending(false)
  }

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase()
  }

  const filteredConversations = conversations.filter(conv =>
    conv.applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.applicant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.job.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <FadeIn delay={200}>
        <AnimatedCard variant="hover-glow" className="p-12 text-center">
          <p className="text-gray-400">Loading conversations...</p>
        </AnimatedCard>
      </FadeIn>
    )
  }

  return (
    <FadeIn delay={200}>
      <div className="h-[calc(100vh-12rem)]">
        <AnimatedCard variant="hover-glow" className="h-full p-0 overflow-hidden">
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-1/3 border-r border-dark-600">
              <div className="p-4 border-b border-dark-600">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <ScrollArea className="h-[calc(100%-73px)]">
                {filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">
                    {searchQuery ? "No conversations found" : "No messages yet"}
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-4 border-b border-dark-600 cursor-pointer hover:bg-dark-700 transition-colors ${
                        selectedConversation?.id === conv.id ? "bg-dark-700" : ""
                      }`}
                      onClick={() => setSelectedConversation(conv)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conv.applicant.avatar_url} />
                          <AvatarFallback>{getInitials(conv.applicant.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-white truncate">
                              {conv.applicant.name}
                            </h4>
                            {conv.unread_count > 0 && (
                              <span className="bg-purple-500 text-xs text-white px-2 py-0.5 rounded-full">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 truncate">{conv.job.title}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(conv.last_message_timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-dark-600">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedConversation.applicant.avatar_url} />
                        <AvatarFallback>{getInitials(selectedConversation.applicant.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{selectedConversation.applicant.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {selectedConversation.applicant.location}
                          </span>
                          <span>{selectedConversation.job.title}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_type === "recruiter" ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              message.sender_type === "recruiter"
                                ? "bg-purple-500 text-white"
                                : "bg-dark-700 text-white"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender_type === "recruiter" ? "text-purple-200" : "text-gray-400"
                            }`}>
                              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-4 border-t border-dark-600">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        sendMessage()
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={isSending}
                        className="flex-1"
                      />
                      <Button type="submit" disabled={isSending || !newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  Select a conversation to start messaging
                </div>
              )}
            </div>
          </div>
        </AnimatedCard>
      </div>
    </FadeIn>
  )
} 