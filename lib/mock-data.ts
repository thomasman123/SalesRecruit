import type { Applicant, Job, Conversation, Message } from "./types"

// Mock jobs data
export const mockJobs: Job[] = [
  {
    id: 1,
    title: "Senior Closer - Executive Coaching",
    status: "active",
    applicants: 6,
    views: 78,
    posted: "5 days ago",
    expires: "25 days left",
    industry: "Coaching",
    priceRange: "$3-10K",
    leadSource: "Inbound",
    commissionStructure: "100% Commission",
    teamSize: "Full team",
    description:
      "We're looking for an experienced closer to join our executive coaching sales team. You'll be responsible for converting qualified leads into high-ticket coaching clients.",
    requirements: [
      "5+ years of sales experience",
      "Experience selling high-ticket coaching or consulting",
      "Excellent communication skills",
      "Self-motivated and results-driven",
    ],
    benefits: [
      "100% commission structure with high earning potential",
      "Flexible remote work",
      "Weekly training and development",
      "Supportive team environment",
    ],
  },
  {
    id: 2,
    title: "Sales Development Rep - SaaS",
    status: "active",
    applicants: 12,
    views: 145,
    posted: "1 week ago",
    expires: "21 days left",
    industry: "SaaS",
    priceRange: "$1-5K",
    leadSource: "Outbound",
    commissionStructure: "Base + Commission",
    teamSize: "Small team",
    description:
      "Join our growing SaaS company as an SDR. You'll be responsible for outbound prospecting and setting qualified appointments for our account executives.",
    requirements: [
      "1+ years of sales experience",
      "Strong phone and email communication skills",
      "Experience with CRM software",
      "Ability to handle rejection and persist",
    ],
    benefits: [
      "Competitive base salary + commission",
      "Health benefits",
      "Career advancement opportunities",
      "Modern tech stack and tools",
    ],
  },
  {
    id: 3,
    title: "Account Executive - Financial Services",
    status: "paused",
    applicants: 8,
    views: 92,
    posted: "2 weeks ago",
    expires: "14 days left",
    industry: "Finance",
    priceRange: "$5-15K",
    leadSource: "Mixed",
    commissionStructure: "Base + Commission",
    teamSize: "Medium team",
    description:
      "We're seeking an experienced Account Executive to sell our financial services to small and medium businesses. You'll manage the full sales cycle from demo to close.",
    requirements: [
      "3+ years of B2B sales experience",
      "Knowledge of financial services industry",
      "Strong presentation and negotiation skills",
      "Track record of meeting or exceeding quota",
    ],
    benefits: [
      "Competitive base + uncapped commission",
      "Comprehensive benefits package",
      "Ongoing professional development",
      "Collaborative team environment",
    ],
  },
  {
    id: 4,
    title: "Sales Manager - Health & Wellness",
    status: "draft",
    applicants: 0,
    views: 0,
    posted: "Not published",
    expires: "N/A",
    industry: "Health",
    priceRange: "$2-8K",
    leadSource: "Inbound",
    commissionStructure: "Base + Commission + Override",
    teamSize: "Growing team",
    description:
      "Lead our health and wellness sales team to success. You'll be responsible for coaching a team of sales representatives and helping them hit their targets.",
    requirements: [
      "5+ years of sales experience",
      "2+ years of sales management experience",
      "Strong leadership and coaching abilities",
      "Experience in health or wellness industry preferred",
    ],
    benefits: [
      "Competitive base salary + commission + team override",
      "Full benefits package",
      "Wellness program",
      "Remote work flexibility",
    ],
  },
]

// Mock applicants data
export const mockApplicants: Applicant[] = [
  {
    id: 1,
    name: "John Smith",
    avatar: "/placeholder.svg?height=40&width=40&query=person 1",
    location: "New York, NY",
    appliedDate: "2 days ago",
    status: "new",
    starred: true,
    experience: "8+ years in SaaS sales",
    highestTicket: "$35,000 executive coaching program",
    salesStyle: "Consultative, value-based selling",
    tools: "HubSpot, Salesforce, Close.io",
    videoUrl: "https://www.loom.com/share/example123",
    notes: "Strong candidate with excellent closing skills. Follow up about availability.",
    jobId: 1,
    email: "john.smith@example.com",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    avatar: "/placeholder.svg?height=40&width=40&query=person 2",
    location: "Austin, TX",
    appliedDate: "5 days ago",
    status: "reviewing",
    starred: false,
    experience: "5 years in fitness industry sales",
    highestTicket: "$12,000 annual coaching package",
    salesStyle: "Relationship-based, empathetic approach",
    tools: "Pipedrive, Zoom, Calendly",
    videoUrl: "https://www.loom.com/share/example456",
    notes: "",
    jobId: 1,
    email: "sarah.johnson@example.com",
  },
  {
    id: 3,
    name: "Michael Brown",
    avatar: "/placeholder.svg?height=40&width=40&query=person 3",
    location: "San Francisco, CA",
    appliedDate: "1 week ago",
    status: "interviewing",
    starred: true,
    experience: "10+ years in tech sales",
    highestTicket: "$50,000 enterprise SaaS contract",
    salesStyle: "Solution selling, technical expertise",
    tools: "Salesforce, Outreach, Gong",
    videoUrl: "https://www.loom.com/share/example789",
    notes: "Scheduled interview for May 27th at 3:30 PM. Prepare technical questions.",
    jobId: 1,
    email: "michael.brown@example.com",
  },
  {
    id: 4,
    name: "Emily Davis",
    avatar: "/placeholder.svg?height=40&width=40&query=person 4",
    location: "Chicago, IL",
    appliedDate: "2 weeks ago",
    status: "hired",
    starred: false,
    experience: "7 years in coaching sales",
    highestTicket: "$25,000 executive program",
    salesStyle: "Consultative, needs-based approach",
    tools: "HubSpot, Zoom, Slack",
    videoUrl: "https://www.loom.com/share/example101",
    notes: "Hired on May 15th. Starting June 1st. Send onboarding materials.",
    jobId: 1,
    email: "emily.davis@example.com",
  },
  {
    id: 5,
    name: "David Wilson",
    avatar: "/placeholder.svg?height=40&width=40&query=person 5",
    location: "Denver, CO",
    appliedDate: "3 days ago",
    status: "new",
    starred: false,
    experience: "4 years in real estate sales",
    highestTicket: "$1.2M property",
    salesStyle: "High-energy, persistent follow-up",
    tools: "Zillow CRM, BombBomb, Calendly",
    videoUrl: "https://www.loom.com/share/example202",
    notes: "",
    jobId: 1,
    email: "david.wilson@example.com",
  },
  {
    id: 6,
    name: "Jennifer Lee",
    avatar: "/placeholder.svg?height=40&width=40&query=person 6",
    location: "Miami, FL",
    appliedDate: "1 week ago",
    status: "rejected",
    starred: false,
    experience: "3 years in SaaS sales",
    highestTicket: "$15,000 annual contract",
    salesStyle: "Feature-focused, technical",
    tools: "Salesforce, Outreach",
    videoUrl: "https://www.loom.com/share/example303",
    notes: "Not enough experience with high-ticket sales. Rejected after initial review.",
    jobId: 1,
    email: "jennifer.lee@example.com",
  },
  {
    id: 7,
    name: "Robert Chen",
    avatar: "/placeholder.svg?height=40&width=40&query=person 7",
    location: "Seattle, WA",
    appliedDate: "4 days ago",
    status: "new",
    starred: true,
    experience: "6 years in B2B software sales",
    highestTicket: "$75,000 enterprise solution",
    salesStyle: "Consultative, ROI-focused",
    tools: "Salesforce, Outreach, LinkedIn Sales Navigator",
    videoUrl: "https://www.loom.com/share/example404",
    notes: "Impressive background with enterprise clients. Schedule first interview ASAP.",
    jobId: 2,
    email: "robert.chen@example.com",
  },
  {
    id: 8,
    name: "Amanda Rodriguez",
    avatar: "/placeholder.svg?height=40&width=40&query=person 8",
    location: "Los Angeles, CA",
    appliedDate: "1 week ago",
    status: "reviewing",
    starred: false,
    experience: "3 years in SaaS sales",
    highestTicket: "$25,000 annual subscription",
    salesStyle: "Relationship-based, consultative",
    tools: "HubSpot, Zoom, Calendly",
    videoUrl: "https://www.loom.com/share/example505",
    notes: "Good energy and communication skills. Need to verify past performance.",
    jobId: 2,
    email: "amanda.rodriguez@example.com",
  },
  {
    id: 9,
    name: "Thomas Jackson",
    avatar: "/placeholder.svg?height=40&width=40&query=person 9",
    location: "Atlanta, GA",
    appliedDate: "6 days ago",
    status: "interviewing",
    starred: true,
    experience: "7 years in financial services sales",
    highestTicket: "$100,000 investment package",
    salesStyle: "Analytical, trust-based approach",
    tools: "Salesforce, Zoom, Excel",
    videoUrl: "https://www.loom.com/share/example606",
    notes: "Strong background in financial services. Second interview scheduled for next week.",
    jobId: 3,
    email: "thomas.jackson@example.com",
  },
  {
    id: 10,
    name: "Lisa Wong",
    avatar: "/placeholder.svg?height=40&width=40&query=person 10",
    location: "Boston, MA",
    appliedDate: "2 weeks ago",
    status: "hired",
    starred: true,
    experience: "9 years in enterprise sales",
    highestTicket: "$250,000 annual contract",
    salesStyle: "Strategic, C-level focused",
    tools: "Salesforce, Gong, LinkedIn Sales Navigator",
    videoUrl: "https://www.loom.com/share/example707",
    notes: "Outstanding candidate with proven track record. Starting next month.",
    jobId: 3,
    email: "lisa.wong@example.com",
  },
]

// Mock conversations data
export const mockConversations: Conversation[] = [
  {
    id: 1,
    recruiterId: 1, // Assuming recruiter ID 1
    applicantId: 1, // John Smith
    jobId: 1,
    lastMessageTimestamp: "2023-05-24T14:30:00Z",
    unreadCount: 0,
  },
  {
    id: 2,
    recruiterId: 1,
    applicantId: 3, // Michael Brown
    jobId: 1,
    lastMessageTimestamp: "2023-05-23T09:15:00Z",
    unreadCount: 2,
  },
  {
    id: 3,
    recruiterId: 1,
    applicantId: 7, // Robert Chen
    jobId: 2,
    lastMessageTimestamp: "2023-05-22T16:45:00Z",
    unreadCount: 0,
  },
  {
    id: 4,
    recruiterId: 1,
    applicantId: 9, // Thomas Jackson
    jobId: 3,
    lastMessageTimestamp: "2023-05-21T11:20:00Z",
    unreadCount: 1,
  },
]

// Mock messages data
export const mockMessages: Message[] = [
  // Conversation with John Smith
  {
    id: 1,
    conversationId: 1,
    senderId: 1, // Recruiter
    senderType: "recruiter",
    content:
      "Hi John, thanks for applying to the Senior Closer position. I was impressed by your experience in SaaS sales. Do you have time for a quick chat this week?",
    timestamp: "2023-05-24T14:30:00Z",
    read: true,
  },
  {
    id: 2,
    conversationId: 1,
    senderId: 1, // John Smith
    senderType: "applicant",
    content:
      "Hi there! Thanks for reaching out. I'd be happy to chat. I'm available Thursday or Friday afternoon if that works for you.",
    timestamp: "2023-05-24T15:45:00Z",
    read: true,
  },
  {
    id: 3,
    conversationId: 1,
    senderId: 1, // Recruiter
    senderType: "recruiter",
    content:
      "Friday at 2pm works great for me. I'll send you a calendar invite with a Zoom link. Looking forward to discussing the role in more detail!",
    timestamp: "2023-05-24T16:10:00Z",
    read: true,
  },
  {
    id: 4,
    conversationId: 1,
    senderId: 1, // John Smith
    senderType: "applicant",
    content: "Perfect, I've added it to my calendar. Looking forward to our conversation!",
    timestamp: "2023-05-24T16:30:00Z",
    read: true,
  },

  // Conversation with Michael Brown
  {
    id: 5,
    conversationId: 2,
    senderId: 1, // Recruiter
    senderType: "recruiter",
    content:
      "Hello Michael, I'm reviewing your application for the Senior Closer position. Your experience with enterprise SaaS sales is exactly what we're looking for. Would you be available for an initial interview next week?",
    timestamp: "2023-05-23T09:15:00Z",
    read: true,
  },
  {
    id: 6,
    conversationId: 2,
    senderId: 3, // Michael Brown
    senderType: "applicant",
    content:
      "Hi! Yes, I'm very interested in the position. I'm available Monday through Wednesday next week. What times work best for you?",
    timestamp: "2023-05-23T10:30:00Z",
    read: true,
  },
  {
    id: 7,
    conversationId: 2,
    senderId: 1, // Recruiter
    senderType: "recruiter",
    content:
      "Great! Let's schedule for Tuesday at 11am PT. I'll send over a calendar invite with details. Could you also share a bit more about your experience with solution selling?",
    timestamp: "2023-05-23T11:00:00Z",
    read: true,
  },
  {
    id: 8,
    conversationId: 2,
    senderId: 3, // Michael Brown
    senderType: "applicant",
    content:
      "Tuesday works perfectly. Regarding solution selling, I've been using this approach for the past 5 years with enterprise clients. I focus on understanding their business challenges first, then tailoring our solution to address their specific pain points. This has helped me consistently exceed quota by 20-30% each quarter.",
    timestamp: "2023-05-23T14:20:00Z",
    read: false,
  },
  {
    id: 9,
    conversationId: 2,
    senderId: 3, // Michael Brown
    senderType: "applicant",
    content:
      "I also have experience training junior sales reps on this methodology, which has improved our team's overall performance.",
    timestamp: "2023-05-23T14:25:00Z",
    read: false,
  },

  // Conversation with Robert Chen
  {
    id: 10,
    conversationId: 3,
    senderId: 1, // Recruiter
    senderType: "recruiter",
    content:
      "Hi Robert, thank you for applying to our Sales Development Rep position. Your background in B2B software sales caught my attention. I'd love to learn more about your experience with outbound prospecting.",
    timestamp: "2023-05-22T16:45:00Z",
    read: true,
  },
  {
    id: 11,
    conversationId: 3,
    senderId: 7, // Robert Chen
    senderType: "applicant",
    content:
      "Hello! Thanks for reaching out. I've spent the last 6 years in B2B software sales, with a strong focus on outbound prospecting. In my current role, I generate about 15-20 qualified meetings per week using a combination of LinkedIn, email sequences, and cold calling.",
    timestamp: "2023-05-22T17:30:00Z",
    read: true,
  },
  {
    id: 12,
    conversationId: 3,
    senderId: 1, // Recruiter
    senderType: "recruiter",
    content:
      "That's impressive, Robert! Would you be available for a phone screening this week? I'd like to discuss your approach in more detail.",
    timestamp: "2023-05-22T18:00:00Z",
    read: true,
  },
  {
    id: 13,
    conversationId: 3,
    senderId: 7, // Robert Chen
    senderType: "applicant",
    content: "I'm free Thursday afternoon or Friday morning. Let me know what works best for you.",
    timestamp: "2023-05-22T18:15:00Z",
    read: true,
  },

  // Conversation with Thomas Jackson
  {
    id: 14,
    conversationId: 4,
    senderId: 1, // Recruiter
    senderType: "recruiter",
    content:
      "Hello Thomas, I'm reviewing your application for the Account Executive position. Your experience in financial services sales is very relevant to this role. Do you have time for a brief call this week?",
    timestamp: "2023-05-21T11:20:00Z",
    read: true,
  },
  {
    id: 15,
    conversationId: 4,
    senderId: 9, // Thomas Jackson
    senderType: "applicant",
    content:
      "Hi there! Yes, I'm definitely interested in discussing the opportunity further. I'm available Wednesday or Thursday afternoon this week.",
    timestamp: "2023-05-21T13:45:00Z",
    read: true,
  },
  {
    id: 16,
    conversationId: 4,
    senderId: 1, // Recruiter
    senderType: "recruiter",
    content:
      "Great! Let's connect on Thursday at 3pm. I'll send a calendar invite. In the meantime, could you share more about your experience with the financial services industry?",
    timestamp: "2023-05-21T14:30:00Z",
    read: true,
  },
  {
    id: 17,
    conversationId: 4,
    senderId: 9, // Thomas Jackson
    senderType: "applicant",
    content:
      "Thursday at 3pm works perfectly. Regarding my experience, I've spent 7 years selling financial services products to both individuals and businesses. I've worked with investment packages, retirement planning, and business financial solutions. My analytical approach helps clients understand the value proposition clearly, which has resulted in a 85% close rate for qualified opportunities.",
    timestamp: "2023-05-21T15:10:00Z",
    read: false,
  },
]
