import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendBookingConfirmationEmail } from '@/lib/email/resend'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    
    const {
      recruiterEmail,
      recruiterName,
      salesProfessionalName,
      jobTitle,
      company,
      scheduledDate,
      scheduledTime,
      meetingLink
    } = body

    // Validate required fields
    if (!recruiterEmail || !recruiterName || !salesProfessionalName || !jobTitle || !company || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Send booking confirmation email
    const result = await sendBookingConfirmationEmail({
      to: recruiterEmail,
      recruiterName,
      salesProfessionalName,
      jobTitle,
      company,
      scheduledDate,
      scheduledTime,
      meetingLink
    })

    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId 
    })
  } catch (error) {
    console.error('Error in booking confirmation API:', error)
    return NextResponse.json(
      { error: 'Failed to send booking confirmation email' },
      { status: 500 }
    )
  }
} 