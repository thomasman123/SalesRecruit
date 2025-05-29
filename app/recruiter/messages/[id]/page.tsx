"use client"

import { redirect, useParams } from "next/navigation"

export default function RecruiterMessageById() {
  const params = useParams()
  const { id } = params ?? {}

  redirect(`/recruiter/messages?c=${id}`)
  return null
}
