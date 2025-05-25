"use client"

import { Target } from "lucide-react"
import { AnimatedNavLink } from "@/components/ui/animated-nav-link"

interface AppHeaderProps {
  navigation?: Array<{ href: string; label: string }>
}

export function AppHeader({
  navigation = [
    { href: "#features", label: "Features" },
    { href: "#about", label: "About" },
    { href: "#contact", label: "Contact" },
  ],
}: AppHeaderProps) {
  return (
    <header className="border-b border-dark-600 bg-dark-900/80 backdrop-blur-sm sticky top-0 z-50 transition-all duration-300">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3 group">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-all duration-300 group-hover:scale-105">
            <Target className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white group-hover:text-purple-400 transition-colors duration-300">
            Sales<span className="font-mono text-purple-400">Recruit</span>
          </h1>
        </div>

        <nav className="hidden md:flex space-x-8">
          {navigation.map((item) => (
            <AnimatedNavLink key={item.href} href={item.href}>
              {item.label}
            </AnimatedNavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
