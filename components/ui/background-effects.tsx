"use client"

export function BackgroundEffects() {
  return (
    <>
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-purple-500/5 animate-pulse" />

      {/* Floating orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      {/* Additional subtle effects */}
      <div
        className="absolute top-1/2 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute top-1/4 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: "3s" }}
      />
    </>
  )
}
