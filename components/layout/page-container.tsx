"use client"

import type React from "react"

import { BackgroundEffects } from "@/components/ui/background-effects"
import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  withBackground?: boolean
}

export function PageContainer({ children, className, withBackground = true }: PageContainerProps) {
  return (
    <div className={cn("min-h-screen bg-dark-900 text-gray-100 relative overflow-hidden", className)}>
      {withBackground && <BackgroundEffects />}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
