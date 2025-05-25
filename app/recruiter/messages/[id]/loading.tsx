import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedCard } from "@/components/ui/animated-card"
import { FadeIn } from "@/components/ui/fade-in"

export default function Loading() {
  return (
    <FadeIn>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Skeleton className="h-5 w-32 bg-dark-700" />
        </div>

        <AnimatedCard className="bg-dark-800/50 border-dark-700 overflow-hidden flex flex-col h-[calc(100vh-220px)]">
          {/* Conversation header */}
          <div className="p-4 border-b border-dark-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full bg-dark-700" />

              <div>
                <Skeleton className="h-5 w-32 bg-dark-700" />
                <Skeleton className="h-4 w-24 mt-1 bg-dark-700" />
              </div>
            </div>

            <Skeleton className="h-9 w-24 bg-dark-700" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}>
                <Skeleton
                  className={`h-20 rounded-lg ${index % 2 === 0 ? "w-3/4 bg-dark-700" : "w-2/3 bg-purple-500/20"}`}
                />
              </div>
            ))}
          </div>

          {/* Message input */}
          <div className="p-4 border-t border-dark-700">
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1 bg-dark-700" />
              <Skeleton className="h-10 w-10 bg-dark-700" />
            </div>
          </div>
        </AnimatedCard>
      </div>
    </FadeIn>
  )
}
