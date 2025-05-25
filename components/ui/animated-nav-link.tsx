"use client"

import type React from "react"

import { cn } from "@/lib/utils"

interface AnimatedNavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  variant?: "underline" | "glow" | "scale"
}

export function AnimatedNavLink({ href, children, className, variant = "underline" }: AnimatedNavLinkProps) {
  const variants = {
    underline: "relative group",
    glow: "transition-all duration-300 hover:text-purple-400 hover:drop-shadow-lg",
    scale: "transition-all duration-300 hover:scale-105",
  }

  return (
    <a
      href={href}
      className={cn("text-gray-300 hover:text-white transition-all duration-300 text-sm", variants[variant], className)}
    >
      {children}
      {variant === "underline" && (
        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 transition-all duration-300 group-hover:w-full" />
      )}
    </a>
  )
}
