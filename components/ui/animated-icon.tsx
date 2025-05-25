"use client"

import type React from "react"

import { cn } from "@/lib/utils"

interface AnimatedIconProps {
  children: React.ReactNode
  variant?: "scale" | "glow" | "bounce" | "pulse"
  color?: "purple" | "blue" | "green" | "amber" | "red" | "white"
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function AnimatedIcon({
  children,
  variant = "scale",
  color = "purple",
  size = "md",
  className,
}: AnimatedIconProps) {
  const variants = {
    scale: "transition-all duration-300 group-hover:scale-110",
    glow: "transition-all duration-300 group-hover:drop-shadow-lg",
    bounce: "animate-bounce",
    pulse: "animate-pulse",
  }

  const colors = {
    purple: "text-purple-400 group-hover:text-purple-300",
    blue: "text-blue-400 group-hover:text-blue-300",
    green: "text-green-400 group-hover:text-green-300",
    amber: "text-amber-400 group-hover:text-amber-300",
    red: "text-red-400 group-hover:text-red-300",
    white: "text-white group-hover:text-gray-200",
  }

  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  }

  return <div className={cn(sizes[size], colors[color], variants[variant], className)}>{children}</div>
}
