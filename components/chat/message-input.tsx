"use client"

import { useState, type FormEvent } from "react"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Send, Paperclip, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"

interface MessageInputProps {
  onSendMessage: (message: string) => void
  isLoading?: boolean
}

export function MessageInput({ onSendMessage, isLoading = false }: MessageInputProps) {
  const [message, setMessage] = useState("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isLoading) {
      onSendMessage(message)
      setMessage("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-dark-600 p-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-dark-700 transition-colors"
          title="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-dark-700 transition-colors"
          title="Send calendar invite"
        >
          <Calendar className="h-5 w-5" />
        </button>
        <div className="flex-1 relative">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="pr-4"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
        </div>
        <AnimatedButton
          type="submit"
          variant="purple"
          size="icon"
          animation="scale"
          disabled={!message.trim() || isLoading}
          className="rounded-full"
        >
          <Send className="h-5 w-5" />
        </AnimatedButton>
      </div>
    </form>
  )
}
