"use client"

import { redirect } from "next/navigation"

export default function RecruiterMessagesRedirect() {
  // Immediately redirect recruiter users to the new unified messaging UI
  redirect("/dashboard/messages")
  return null
}
