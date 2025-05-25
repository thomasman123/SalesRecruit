"use client"

import type React from "react"

import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface AnimatedButtonProps extends ButtonProps {
  variant?: "default" | "purple" | "ghost" | "outline"
  animation?: "scale" | "glow" | "slide" | "none"
  icon?: React.ReactNode
}

const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, variant = "default", animation = "scale", icon, children, ...props }, ref) => {
    const variants = {
      default: "bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700",
      purple: "bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700",
      ghost: "bg-transparent text-gray-300 hover:text-white hover:bg-dark-700",
      outline: "border border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white",
    }

    const animations = {
      scale: "transition-all duration-300 hover:scale-105 group",
      glow: "transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40",
      slide: "transition-all duration-300 group",
      none: "transition-all duration-300",
    }

    return (
      <Button
        ref={ref}
        className={cn(
          variants[variant],
          animations[animation],
          animation === "glow" && "shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40",
          className,
        )}
        {...props}
      >
        {children}
        {icon && (
          <span
            className={cn(
              "ml-2",
              animation === "slide" && "group-hover:translate-x-1 transition-transform duration-300",
            )}
          >
            {icon}
          </span>
        )}
      </Button>
    )
  },
)

AnimatedButton.displayName = "AnimatedButton"

export { AnimatedButton }
