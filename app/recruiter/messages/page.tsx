import { AccessWrapper } from "@/components/recruiter/access-wrapper"
import { MessagesContent } from "./messages-content"
import { FadeIn } from "@/components/ui/fade-in"

export default function RecruiterMessagesPage() {
  return (
    <AccessWrapper>
      <div className="container mx-auto max-w-7xl">
        <FadeIn delay={100}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
            <p className="text-gray-400">Communicate with candidates and manage conversations</p>
          </div>
        </FadeIn>
        <MessagesContent />
      </div>
    </AccessWrapper>
  )
}
