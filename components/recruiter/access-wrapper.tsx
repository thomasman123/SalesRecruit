"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { AccessRestricted } from "./access-restricted"

interface AccessWrapperProps {
  children: React.ReactNode
}

export function AccessWrapper({ children }: AccessWrapperProps) {
  const [hasFullAccess, setHasFullAccess] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAccess()
  }, [])

  const checkAccess = async () => {
    const supabase = getSupabaseClient()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setHasFullAccess(false)
        setLoading(false)
        return
      }

      // Check if user has full_access
      const { data, error } = await supabase
        .from('users')
        .select('full_access')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error checking access:', error)
        // If column doesn't exist, assume no access
        setHasFullAccess(false)
      } else {
        setHasFullAccess(data?.full_access || false)
      }
    } catch (error) {
      console.error('Error:', error)
      setHasFullAccess(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-dark-700 rounded w-48 mb-4"></div>
          <div className="h-4 bg-dark-700 rounded w-32"></div>
        </div>
      </div>
    )
  }

  // If they don't have full access, show the restricted component
  if (!hasFullAccess) {
    return <AccessRestricted />
  }

  // Otherwise, show the actual content
  return <>{children}</>
} 