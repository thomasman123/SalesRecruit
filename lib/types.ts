// Applicant types
export type ApplicantStatus = "new" | "reviewing" | "interviewing" | "hired" | "rejected"

export interface Applicant {
  id: number
  name: string
  avatar: string
  location: string
  appliedDate: string
  status: ApplicantStatus
  starred: boolean
  experience: string
  highestTicket: string
  salesStyle: string
  tools: string
  videoUrl: string
  notes: string
  jobId: number
  email: string
}

// Job types
export type JobStatus = "active" | "paused" | "draft" | "closed"

export interface Job {
  id: number
  title: string
  status: JobStatus
  applicants: number
  views: number
  posted: string
  expires: string
  industry: string
  priceRange: string
  leadSource: string
  commissionStructure: string
  teamSize: string
  description?: string
  requirements?: string[]
  benefits?: string[]
}

// Message types
export interface Message {
  id: number
  conversationId: number
  senderId: number
  senderType: "recruiter" | "applicant"
  content: string
  timestamp: string
  read: boolean
}

export interface Conversation {
  id: number
  recruiterId: number
  applicantId: number
  jobId: number
  lastMessageTimestamp: string
  unreadCount: number
}
