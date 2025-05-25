import { Suspense } from "react"
import CallbackClient from "./callback-client"

export const dynamic = 'force-dynamic'

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-white">Loading…</div>}>
      <CallbackClient />
    </Suspense>
  )
} 