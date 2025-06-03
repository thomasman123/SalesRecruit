"use client"

import React, { useState, useEffect } from 'react'
import { FadeIn } from '@/components/ui/fade-in'
import { AnimatedCard } from '@/components/ui/animated-card'

export function InteractiveDashboard() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Real-Time Analytics Card
  const RealTimeAnalyticsCard = () => {
    const closeRate = 87
    const circumference = 2 * Math.PI * 40
    const offset = circumference - (closeRate / 100) * circumference

    return (
      <AnimatedCard 
        variant="interactive" 
        className="p-6 h-full border-dark-600 bg-dark-800/30 hover:bg-dark-800/50 transition-all duration-300"
        onMouseEnter={() => setHoveredCard('analytics')}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <h3 className="text-xl font-semibold text-white mb-2">Real-Time Analytics</h3>
        <p className="text-gray-400 text-sm mb-6">
          Monitor your hiring success live with clear, intuitive dashboards.
        </p>
        
        <div className="relative">
          {/* Background card */}
          <div className="absolute left-4 top-4 w-48 h-16 bg-dark-700/40 rounded-xl opacity-60"></div>
          
          {/* Foreground card */}
          <div className="relative flex items-center w-48 h-16 bg-dark-800/60 rounded-xl border border-dark-700 p-4">
            {/* Circular progress */}
            <div className="relative mr-4">
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 88 88">
                <circle
                  cx="44"
                  cy="44"
                  r="40"
                  stroke="#374151"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="44"
                  cy="44"
                  r="40"
                  stroke="#8b5cf6"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className={`transition-all duration-1000 ${hoveredCard === 'analytics' ? 'animate-pulse' : ''}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">👤</span>
                </div>
              </div>
            </div>
            
            <div>
              <div className="text-lg font-semibold text-white">{closeRate}%</div>
              <div className="text-xs text-gray-400">Hire Rate</div>
            </div>
          </div>
        </div>
      </AnimatedCard>
    )
  }

  // Automated Reports Card
  const AutomatedReportsCard = () => {
    const isHovered = hoveredCard === 'reports'
    
    return (
      <AnimatedCard 
        variant="interactive" 
        className="p-6 h-full border-dark-600 bg-dark-800/30 hover:bg-dark-800/50 transition-all duration-300"
        onMouseEnter={() => setHoveredCard('reports')}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <h3 className="text-xl font-semibold text-white mb-2">Automated Reports</h3>
        <p className="text-gray-400 text-sm mb-6">
          Generate placement summaries instantly—no manual work needed.
        </p>
        
        <div className="relative h-24 bg-dark-800/60 rounded-xl border border-dark-700 p-4 overflow-hidden">
          {/* Animated line chart */}
          <svg className="w-full h-full" viewBox="0 0 200 60">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Area under curve */}
            <path
              d="M10,50 Q50,30 90,25 T170,20 L170,55 L10,55 Z"
              fill="url(#areaGradient)"
              className={`transition-all duration-1000 ${isHovered ? 'translate-x-1' : ''}`}
            />
            
            {/* Line */}
            <path
              d="M10,50 Q50,30 90,25 T170,20"
              stroke="url(#lineGradient)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              className={`transition-all duration-1000 ${isHovered ? 'translate-x-1' : ''}`}
            />
            
            {/* Animated dot */}
            <circle
              cx={isHovered ? "175" : "170"}
              cy="20"
              r="4"
              fill="#8b5cf6"
              className="transition-all duration-1000"
            />
          </svg>
        </div>
      </AnimatedCard>
    )
  }

  // Smart Pipeline Card
  const SmartPipelineCard = () => {
    const isHovered = hoveredCard === 'pipeline'
    
    return (
      <AnimatedCard 
        variant="interactive" 
        className="p-6 h-full border-dark-600 bg-dark-800/30 hover:bg-dark-800/50 transition-all duration-300"
        onMouseEnter={() => setHoveredCard('pipeline')}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <h3 className="text-xl font-semibold text-white mb-2">Smart Pipeline</h3>
        <p className="text-gray-400 text-sm mb-6">
          Plan and adjust with AI-powered candidate recommendations.
        </p>
        
        <div className="relative h-24 bg-dark-800/60 rounded-xl border border-dark-700 p-4 flex items-center justify-center gap-4">
          {/* Donut charts */}
          <div className="relative">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="16" stroke="#374151" strokeWidth="6" fill="none" />
              <circle 
                cx="20" 
                cy="20" 
                r="16" 
                stroke="#8b5cf6" 
                strokeWidth="6" 
                fill="none"
                strokeDasharray="75.4 25.1"
                strokeLinecap="round"
                className={`transition-all duration-1000 ${isHovered ? 'rotate-12' : ''}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">75%</div>
          </div>
          
          <div className="relative">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="16" stroke="#374151" strokeWidth="6" fill="none" />
              <circle 
                cx="20" 
                cy="20" 
                r="16" 
                stroke="#f97316" 
                strokeWidth="6" 
                fill="none"
                strokeDasharray="62.8 37.7"
                strokeLinecap="round"
                className={`transition-all duration-1000 delay-100 ${isHovered ? 'rotate-12' : ''}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">62%</div>
          </div>
        </div>
      </AnimatedCard>
    )
  }

  // Secure Matching Card
  const SecureMatchingCard = () => {
    const isHovered = hoveredCard === 'matching'
    
    return (
      <AnimatedCard 
        variant="interactive" 
        className="p-6 h-full border-dark-600 bg-dark-800/30 hover:bg-dark-800/50 transition-all duration-300"
        onMouseEnter={() => setHoveredCard('matching')}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <h3 className="text-xl font-semibold text-white mb-2">Secure Matching</h3>
        <p className="text-gray-400 text-sm mb-6">
          Link candidates safely with real-time data syncing.
        </p>
        
        <div className="relative h-24 bg-dark-800/60 rounded-xl border border-dark-700 p-4 flex items-center justify-center">
          {/* Animated loading bars */}
          <div className="space-y-2 w-full max-w-32">
            {[0.8, 0.6, 0.9, 0.4, 0.7].map((width, index) => (
              <div key={index} className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-1000"
                  style={{ 
                    width: isHovered ? `${width * 100}%` : '0%',
                    transitionDelay: `${index * 100}ms`
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </AnimatedCard>
    )
  }

  // Growth Score Card
  const GrowthScoreCard = () => {
    const isHovered = hoveredCard === 'growth'
    const score = 94
    
    return (
      <AnimatedCard 
        variant="interactive" 
        className="p-6 h-full border-dark-600 bg-dark-800/30 hover:bg-dark-800/50 transition-all duration-300"
        onMouseEnter={() => setHoveredCard('growth')}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <h3 className="text-xl font-semibold text-white mb-2">Growth Score</h3>
        <p className="text-gray-400 text-sm mb-6">
          View key metrics and team trends at a glance.
        </p>
        
        <div className="relative h-24 bg-dark-800/60 rounded-xl border border-dark-700 p-4 flex items-center justify-end">
          {/* Large score number with animation */}
          <div className="relative">
            <div 
              className={`text-4xl font-bold text-white transition-all duration-700 ${
                isHovered ? 'text-purple-400 scale-110' : ''
              }`}
            >
              {score}
            </div>
            <div className="absolute -top-2 -right-6 w-8 h-8 bg-purple-500/20 rounded-lg transform rotate-12 opacity-60"></div>
          </div>
        </div>
      </AnimatedCard>
    )
  }

  return (
    <section className="py-24 px-6 relative">
      <div className="container mx-auto">
        <FadeIn delay={0}>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              The Smart, Fair, and{" "}
              <span className="text-purple-400 bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">
                Superior Way
              </span>{" "}
              to Hire
            </h2>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
              Everything you need to build a world-class sales team, powered by AI and designed for results.
            </p>
          </div>
        </FadeIn>

        {/* Interactive Dashboard Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <FadeIn delay={100}>
            <RealTimeAnalyticsCard />
          </FadeIn>
          
          <FadeIn delay={200}>
            <AutomatedReportsCard />
          </FadeIn>
          
          <FadeIn delay={300}>
            <SmartPipelineCard />
          </FadeIn>
          
          <FadeIn delay={400}>
            <SecureMatchingCard />
          </FadeIn>
          
          <FadeIn delay={500}>
            <GrowthScoreCard />
          </FadeIn>
        </div>
      </div>
    </section>
  )
} 