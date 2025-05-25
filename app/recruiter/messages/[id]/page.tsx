"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Send, Paperclip, Calendar } from "lucide-react"
import { AnimatedCard } from "@/components/ui/animated-card"
import { FadeIn } from "@/components/ui/fade-in"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AnimatedButton } from "@/components/ui/animated-button"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"

// Mock conversation data
const conversations = [
  {
    id: "1",
    applicantId: "a1",
    applicantName: "John Doe",
    jobTitle: "Senior Sales Representative",
    jobId: "j1",
    avatar: "/placeholder.svg?height=40&width=40&query=person with brown hair",
    messages: [
      {
        id: "m1",
        sender: "applicant",
        content:
          "Hello! I'm very interested in the Senior Sales Representative position at your company. I have 5 years of experience in B2B sales and consistently exceeded my targets in my previous role.",
        timestamp: "Yesterday, 2:30 PM",
      },
      {
        id: "m2",
        sender: "recruiter",
        content:
          "Hi John, thanks for your application! Your experience looks impressive. Could you tell me more about your experience with CRM software?",
        timestamp: "Yesterday, 3:15 PM",
      },
      {
        id: "m3",
        sender: "applicant",
        content:
          "Thanks for considering my application. I'm excited about the opportunity! I have extensive experience with Salesforce, HubSpot, and Zoho CRM. I've used these tools to manage customer relationships, track sales pipelines, and generate reports for management.",
        timestamp: "Today, 10:30 AM",
      },
    ],
  },
  {
    id: "2",
    applicantId: "a2",
    applicantName: "Sarah Johnson",
    jobTitle: "Sales Manager",
    jobId: "j2",
    avatar: "/placeholder.svg?height=40&width=40&query=woman with blonde hair",
    messages: [
      {
        id: "m1",
        sender: "applicant",
        content:
          "Hello, I'm applying for the Sales Manager position. I've been leading a team of 8 sales representatives for the past 3 years with great results.",
        timestamp: "Monday, 9:45 AM",
      },
      {
        id: "m2",
        sender: "recruiter",
        content:
          "Hi Sarah, thank you for your interest! Your leadership experience sounds valuable. Would you be available for an interview this week?",
        timestamp: "Monday, 11:20 AM",
      },
      {
        id: "m3",
        sender: "applicant",
        content: "I'm available for an interview on Thursday afternoon if that works for you.",
        timestamp: "Yesterday, 8:15 AM",
      },
    ],
  },
  {
    id: "3",
    applicantId: "a3",
    applicantName: "Michael Chen",
    jobTitle: "Account Executive",
    jobId: "j3",
    avatar: "/placeholder.svg?height=40&width=40&query=asian man with glasses",
    messages: [
      {
        id: "m1",
        sender: "applicant",
        content:
          "Hello, I'm interested in the Account Executive position. I have a strong track record in enterprise sales and account management.",
        timestamp: "Tuesday, 1:30 PM",
      },
      {
        id: "m2",
        sender: "recruiter",
        content:
          "Hi Michael, thanks for reaching out! Your background sounds promising. Could you share some examples of your work or a portfolio?",
        timestamp: "Tuesday, 4:45 PM",
      },
      {
        id: "m3",
        sender: "applicant",
        content: "I've attached my portfolio as requested. Looking forward to your feedback!",
        timestamp: "Yesterday, 11:20 AM",
      },
    ],
  },
  {
    id: "4",
    applicantId: "a4",
    applicantName: "Emily Rodriguez",
    jobTitle: "Sales Development Representative",
    jobId: "j4",
    avatar: "/placeholder.svg?height=40&width=40&query=latina woman smiling",
    messages: [
      {
        id: "m1",
        sender: "applicant",
        content:
          "Hi there! I'm applying for the SDR position. I'm a recent graduate with internship experience in sales and marketing.",
        timestamp: "Last week",
      },
      {
        id: "m2",
        sender: "recruiter",
        content:
          "Hello Emily, thank you for your application. The role requires prospecting and setting up meetings with potential clients. Could you tell me about your experience with cold calling and email outreach?",
        timestamp: "Last week",
      },
      {
        id: "m3",
        sender: "applicant",
        content: "Thank you for the information about the role. I have a few questions about the team structure.",
        timestamp: "Monday, 3:45 PM",
      },
    ],
  },
  {
    id: "5",
    applicantId: "a5",
    applicantName: "David Wilson",
    jobTitle: "Territory Sales Manager",
    jobId: "j5",
    avatar: "/placeholder.svg?height=40&width=40&query=man with beard",
    messages: [
      {
        id: "m1",
        sender: "applicant",
        content:
          "Hello, I'm interested in the Territory Sales Manager position. I have 7 years of experience managing sales territories across the West Coast.",
        timestamp: "Last week",
      },
      {
        id: "m2",
        sender: "recruiter",
        content:
          "Hi David, thanks for your interest! Your experience is impressive. Could you share more details about your sales performance in your current territory?",
        timestamp: "Last week",
      },
      {
        id: "m3",
        sender: "applicant",
        content: "I appreciate the quick response. The compensation package sounds great!",
        timestamp: "Last week",
      },
    ],
  },
]

export default function ConversationPage() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [newMessage, setNewMessage] = useState("")
  const [conversation, setConversation] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Find the conversation based on the ID
  useEffect(() => {
    const foundConversation = conversations.find((c) => c.id === id)
    if (foundConversation) {
      setConversation(foundConversation)
    } else {
      // Handle not found
      router.push("/recruiter/messages")
    }
  }, [id, router])

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim()) return

    // Add the new message to the conversation
    const updatedConversation = {
      ...conversation,
      messages: [
        ...conversation.messages,
        {
          id: `m${conversation.messages.length + 1}`,
          sender: "recruiter",
          content: newMessage,
          timestamp: "Just now",
        },
      ],
    }

    setConversation(updatedConversation)
    setNewMessage("")

    // Show toast notification
    toast({
      title: "Message sent",
      description: "Your message has been sent to the applicant.",
    })
  }

  if (!conversation) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-400">Loading conversation...</p>
      </div>
    )
  }

  return (
    <FadeIn>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/recruiter/messages"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to messages
          </Link>
        </div>

        <AnimatedCard className="bg-dark-800/50 border-dark-700 overflow-hidden flex flex-col h-[calc(100vh-220px)]">
          {/* Conversation header */}
          <div className="p-4 border-b border-dark-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-dark-600">
                <AvatarImage src={conversation.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-purple-500/20 text-purple-400">
                  {conversation.applicantName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>

              <div>
                <h3 className="font-medium text-white">{conversation.applicantName}</h3>
                <p className="text-sm text-gray-400">{conversation.jobTitle}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Link href={`/recruiter/jobs/${conversation.jobId}/applicants/${conversation.applicantId}`}>
                <AnimatedButton variant="outline" size="sm">
                  View Profile
                </AnimatedButton>
              </Link>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {conversation.messages.map((message: any) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "recruiter" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === "recruiter" ? "bg-purple-500/20 text-white" : "bg-dark-700 text-gray-200"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs text-gray-400 mt-1 text-right">{message.timestamp}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <div className="p-4 border-t border-dark-700">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="pr-20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage(e)
                    }
                  }}
                />

                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
                  <button
                    type="button"
                    className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-dark-600 transition-colors"
                    onClick={() => {
                      toast({
                        title: "Calendar link",
                        description: "Calendar link feature will be implemented soon.",
                      })
                    }}
                  >
                    <Calendar className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-dark-600 transition-colors"
                    onClick={() => {
                      toast({
                        title: "Attachment",
                        description: "File attachment feature will be implemented soon.",
                      })
                    }}
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <AnimatedButton type="submit" disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </AnimatedButton>
            </form>
          </div>
        </AnimatedCard>
      </div>
    </FadeIn>
  )
}
