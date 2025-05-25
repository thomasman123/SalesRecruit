import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedCard } from "@/components/ui/animated-card"
import { FadeIn } from "@/components/ui/fade-in"

export default function Loading() {
  return (
    <FadeIn>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <Skeleton className="h-8 w-48 bg-dark-700" />
            <Skeleton className="h-4 w-64 mt-2 bg-dark-700" />
          </div>

          <div className="w-full md:w-auto flex gap-2">
            <Skeleton className="h-10 w-full md:w-64 bg-dark-700" />
            <Skeleton className="h-10 w-24 bg-dark-700" />
          </div>
        </div>

        <AnimatedCard className="bg-dark-800/50 border-dark-700">
          <div className="divide-y divide-dark-700">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-full bg-dark-700" />

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <Skeleton className="h-5 w-32 bg-dark-700" />
                        <Skeleton className="h-4 w-24 mt-1 bg-dark-700" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-16 bg-dark-700" />
                        <Skeleton className="h-4 w-4 bg-dark-700" />
                      </div>
                    </div>

                    <Skeleton className="h-4 w-full mt-2 bg-dark-700" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AnimatedCard>
      </div>
    </FadeIn>
  )
}
