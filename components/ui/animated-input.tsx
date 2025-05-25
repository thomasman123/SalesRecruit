"use client"

import { Input, type InputProps } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface AnimatedInputProps extends InputProps {
  variant?: "default" | "glow"
}

const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default:
        "border-dark-600 bg-dark-700 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 hover:border-purple-500/50",
      glow: "border-dark-600 bg-dark-700 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20 focus:shadow-lg focus:shadow-purple-500/10 transition-all duration-300 hover:border-purple-500/50",
    }

    return <Input ref={ref} className={cn(variants[variant], className)} {...props} />
  },
)

AnimatedInput.displayName = "AnimatedInput"

export { AnimatedInput }
