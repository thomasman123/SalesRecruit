import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    
    const {
      type, // 'invitation' | 'reminder'
      interviewId,
      recipientEmail,
      recipientName,
      jobTitle,
      company,
      scheduledDate,
      scheduledTime,
      meetingLink,
      recruiterName,
      salesRepName,
    } = body

    let subject = ''
    let htmlContent = ''

    if (type === 'invitation') {
      subject = `Interview Invitation: ${jobTitle} at ${company}`
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8B5CF6;">Interview Invitation</h2>
          
          <p>Dear ${recipientName},</p>
          
          <p>You have been invited to an interview for the <strong>${jobTitle}</strong> position at <strong>${company}</strong>.</p>
          
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Interview Details:</h3>
            <p><strong>📅 Date:</strong> ${new Date(scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>🕐 Time:</strong> ${scheduledTime}</p>
            <p><strong>👥 Participants:</strong> ${recruiterName} (Recruiter), ${salesRepName} (Sales Representative)</p>
            ${meetingLink ? `<p><strong>🔗 Meeting Link:</strong> <a href="${meetingLink}" style="color: #8B5CF6;">Join Google Meet</a></p>` : ''}
          </div>
          
          <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>📧 Important:</strong> Please check your email for a Google Calendar invite and accept it to confirm your attendance.</p>
          </div>
          
          <p>You will receive reminder emails:</p>
          <ul>
            <li>1 day before the interview</li>
            <li>2 hours before the interview</li>
          </ul>
          
          <p>If you need to reschedule or have any questions, please contact us through the Helios Recruit platform.</p>
          
          <p>Best regards,<br>The Helios Recruit Team</p>
          
          <hr style="margin-top: 40px; border: none; border-top: 1px solid #E5E7EB;">
          <p style="font-size: 12px; color: #6B7280; text-align: center;">
            This email was sent by Helios Recruit. If you believe this was sent in error, please ignore this email.
          </p>
        </div>
      `
    } else if (type === 'reminder') {
      const hoursUntil = body.hoursUntil || 24
      const timeframe = hoursUntil >= 24 ? `${hoursUntil / 24} day${hoursUntil / 24 > 1 ? 's' : ''}` : `${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}`
      
      subject = `Reminder: Interview in ${timeframe} - ${jobTitle} at ${company}`
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8B5CF6;">Interview Reminder</h2>
          
          <p>Dear ${recipientName},</p>
          
          <p>This is a reminder that you have an interview scheduled in <strong>${timeframe}</strong>.</p>
          
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Interview Details:</h3>
            <p><strong>💼 Position:</strong> ${jobTitle} at ${company}</p>
            <p><strong>📅 Date:</strong> ${new Date(scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>🕐 Time:</strong> ${scheduledTime}</p>
            <p><strong>👥 Participants:</strong> ${recruiterName} (Recruiter), ${salesRepName} (Sales Representative)</p>
            ${meetingLink ? `<p><strong>🔗 Meeting Link:</strong> <a href="${meetingLink}" style="color: #8B5CF6; font-weight: bold;">Join Google Meet</a></p>` : ''}
          </div>
          
          <div style="background-color: #DBEAFE; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0;">Preparation Tips:</h4>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Test your camera and microphone</li>
              <li>Find a quiet space with good lighting</li>
              <li>Have your resume ready</li>
              <li>Prepare questions about the role</li>
            </ul>
          </div>
          
          <p>Good luck with your interview!</p>
          
          <p>Best regards,<br>The Helios Recruit Team</p>
          
          <hr style="margin-top: 40px; border: none; border-top: 1px solid #E5E7EB;">
          <p style="font-size: 12px; color: #6B7280; text-align: center;">
            This email was sent by Helios Recruit. If you believe this was sent in error, please ignore this email.
          </p>
        </div>
      `
    }

    // Send email using Resend
    if (process.env.RESEND_API_KEY) {
      const { data, error } = await resend.emails.send({
        from: 'Helios Recruit <notifications@heliosrecruit.com>',
        to: recipientEmail,
        subject,
        html: htmlContent,
      })

      if (error) {
        console.error('Error sending email:', error)
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
      }

      return NextResponse.json({ success: true, emailId: data?.id })
    } else {
      // If Resend is not configured, just log the email
      console.log('Email would be sent:', { to: recipientEmail, subject })
      return NextResponse.json({ success: true, message: 'Email logged (Resend not configured)' })
    }
  } catch (error) {
    console.error('Error in email notification API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 