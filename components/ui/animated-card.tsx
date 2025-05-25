"use client"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"
import type { ReactNode, HTMLAttributes } from "react"

interface AnimatedCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "hover-lift" | "hover-glow" | "interactive"
  glowColor?: "purple" | "blue" | "green" | "amber" | "red"
  children?: ReactNode
}

const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, variant = "default", glowColor = "purple", children, ...props }, ref) => {
    const variants = {
      default: "transition-all duration-300",
      "hover-lift": "transition-all duration-500 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/10",
      "hover-glow": "transition-all duration-500 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10",
      interactive:
        "transition-all duration-500 hover:scale-105 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer",
    }

    const glowColors = {
      purple: "hover:shadow-purple-500/10 hover:border-purple-500/30",
      blue: "hover:shadow-blue-500/10 hover:border-blue-500/30",
      green: "hover:shadow-green-500/10 hover:border-green-500/30",
      amber: "hover:shadow-amber-500/10 hover:border-amber-500/30",
      red: "hover:shadow-red-500/10 hover:border-red-500/30",
    }

    return (
      <Card
        ref={ref}
        className={cn(
          "border-dark-600 bg-dark-800/50 backdrop-blur-sm shadow-2xl shadow-black/20",
          variants[variant],
          glowColors[glowColor],
          className,
        )}
        {...props}
      >
        {children}
      </Card>
    )
  },
)

AnimatedCard.displayName = "AnimatedCard"

export { AnimatedCard }
