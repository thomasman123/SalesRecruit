"use client"

import { useState } from "react"
import Link from "next/link"
import { AnimatedCard } from "@/components/ui/animated-card"
import { FadeIn } from "@/components/ui/fade-in"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, MessageCircle } from "lucide-react"
import { Input } from "@/components/ui/input"

// Mock conversation data
const conversations = [
  {
    id: "1",
    applicantName: "John Doe",
    jobTitle: "Senior Sales Representative",
    avatar: "/placeholder.svg?height=40&width=40&query=person with brown hair",
    lastMessage: "Thanks for considering my application. I'm excited about the opportunity!",
    timestamp: "Today, 10:30 AM",
    unread: true,
  },
  {
    id: "2",
    applicantName: "Sarah Johnson",
    jobTitle: "Sales Manager",
    avatar: "/placeholder.svg?height=40&width=40&query=woman with blonde hair",
    lastMessage: "I'm available for an interview on Thursday afternoon if that works for you.",
    timestamp: "Yesterday, 8:15 AM",
    unread: false,
  },
  {
    id: "3",
    applicantName: "Michael Chen",
    jobTitle: "Account Executive",
    avatar: "/placeholder.svg?height=40&width=40&query=asian man with glasses",
    lastMessage: "I've attached my portfolio as requested. Looking forward to your feedback!",
    timestamp: "Yesterday, 11:20 AM",
    unread: true,
  },
  {
    id: "4",
    applicantName: "Emily Rodriguez",
    jobTitle: "Sales Development Representative",
    avatar: "/placeholder.svg?height=40&width=40&query=latina woman smiling",
    lastMessage: "Thank you for the information about the role. I have a few questions about the team structure.",
    timestamp: "Monday, 3:45 PM",
    unread: false,
  },
  {
    id: "5",
    applicantName: "David Wilson",
    jobTitle: "Territory Sales Manager",
    avatar: "/placeholder.svg?height=40&width=40&query=man with beard",
    lastMessage: "I appreciate the quick response. The compensation package sounds great!",
    timestamp: "Last week",
    unread: false,
  },
]

export default function MessagesPage() {
  const [searchQuery, setSearchQuery] = useState("")

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <FadeIn>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          <div className="text-sm text-gray-400">{conversations.filter((c) => c.unread).length} unread messages</div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search messages..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <Link key={conversation.id} href={`/recruiter/messages/${conversation.id}`}>
                <AnimatedCard
                  className={`p-4 hover:border-purple-500/50 transition-all duration-300 ${
                    conversation.unread ? "border-purple-500/50 bg-dark-800/80" : "border-dark-700 bg-dark-800/50"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10 border border-dark-600">
                      <AvatarImage src={conversation.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-purple-500/20 text-purple-400">
                        {conversation.applicantName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium text-white truncate">{conversation.applicantName}</h3>
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{conversation.timestamp}</span>
                      </div>

                      <p className="text-sm text-gray-400 mb-2">{conversation.jobTitle}</p>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-300 truncate pr-4">{conversation.lastMessage}</p>
                        {conversation.unread && <Badge className="bg-purple-500 text-white ml-2">New</Badge>}
                      </div>
                    </div>
                  </div>
                </AnimatedCard>
              </Link>
            ))
          ) : (
            <AnimatedCard className="p-8 text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-500" />
              <h3 className="text-lg font-medium text-white mb-2">No messages found</h3>
              <p className="text-gray-400">
                {searchQuery
                  ? "No messages match your search criteria."
                  : "You don't have any messages yet. Start a conversation with an applicant."}
              </p>
            </AnimatedCard>
          )}
        </div>
      </div>
    </FadeIn>
  )
}
