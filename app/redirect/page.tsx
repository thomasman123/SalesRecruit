"use client"

import { useEffect } from "react"

export default function RedirectPage() {
  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        const response = await fetch('/api/auth/navigate')
        const data = await response.json()
        
        console.log("Redirect page - Navigation data:", data)
        
        if (data.redirectTo) {
          // Use replace to prevent back button issues
          window.location.replace(data.redirectTo)
        } else {
          window.location.replace('/login')
        }
      } catch (error) {
        console.error("Redirect error:", error)
        window.location.replace('/login')
      }
    }

    checkAndRedirect()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-white">Redirecting...</p>
      </div>
    </div>
  )
} 