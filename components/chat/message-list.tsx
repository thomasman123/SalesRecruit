import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Message {
  id: number
  conversationId: number
  senderId: number
  senderType: "recruiter" | "applicant"
  content: string
  timestamp: string
  read: boolean
}

interface Applicant {
  id: number
  name: string
  avatar?: string
}

interface MessageListProps {
  messages: Message[]
  applicant: Applicant
}

export function MessageList({ messages, applicant }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.senderType === "recruiter" ? "justify-end" : "justify-start"}`}
        >
          {message.senderType === "applicant" && (
            <Avatar className="h-8 w-8 mr-2 mt-1 border border-dark-600 flex-shrink-0">
              <AvatarImage src={applicant.avatar || "/placeholder.svg"} alt={applicant.name} />
              <AvatarFallback className="bg-purple-500/20 text-purple-400">
                {applicant.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          )}

          <div
            className={`max-w-[80%] rounded-lg p-3 ${
              message.senderType === "recruiter" ? "bg-purple-500/20 text-white" : "bg-dark-700 text-gray-200"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            <p className="text-xs text-gray-400 mt-1 text-right">{new Date(message.timestamp).toLocaleString()}</p>
          </div>

          {message.senderType === "recruiter" && (
            <Avatar className="h-8 w-8 ml-2 mt-1 border border-dark-600 flex-shrink-0">
              <AvatarImage src="/placeholder.svg?height=32&width=32&query=recruiter" alt="You" />
              <AvatarFallback className="bg-purple-500/20 text-purple-400">You</AvatarFallback>
            </Avatar>
          )}
        </div>
      ))}
    </div>
  )
}
