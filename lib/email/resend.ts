import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Sender address – must belong to a domain verified in Resend.
// Configure in Vercel / Supabase as RESEND_FROM="Helios Recruit <noreply@updates.heliosrecruit.com>"
// Falls back to Resend's sandbox domain so dev/test still works even when
// you haven't verified your own domain yet (e-mails may land in spam).
const DEFAULT_FROM = "Helios Recruit <onboarding@resend.dev>"
const FROM = process.env.RESEND_FROM || DEFAULT_FROM

interface JobNotificationEmailProps {
  to: string;
  name: string;
  jobTitle: string;
  jobId: number;
  industry: string;
  priceRange: string;
  teamSize: string;
  companyOverview?: string;
}

interface InvitationEmailProps {
  to: string;
  salesProfessionalName: string;
  jobTitle: string;
  company: string;
  industry: string;
  priceRange: string;
  commission: string;
  remote: boolean;
  recruiterName: string;
  message?: string;
}

interface BookingConfirmationEmailProps {
  to: string;
  recruiterName: string;
  salesProfessionalName: string;
  jobTitle: string;
  company: string;
  scheduledDate: string;
  scheduledTime: string;
  meetingLink?: string;
}

export async function sendJobNotificationEmail({
  to,
  name,
  jobTitle,
  jobId,
  industry,
  priceRange,
  teamSize,
  companyOverview
}: JobNotificationEmailProps) {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ||
      'http://localhost:3000'

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [to],
      subject: `New Job Opportunity: ${jobTitle}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Job Opportunity</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f8fafc;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
              color: white;
              padding: 32px 24px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .header .subtitle {
              margin: 8px 0 0 0;
              opacity: 0.9;
              font-size: 16px;
            }
            .content {
              padding: 32px 24px;
            }
            .greeting {
              font-size: 18px;
              margin-bottom: 24px;
              color: #1f2937;
            }
            .job-card {
              background: #f9fafb;
              border-radius: 12px;
              padding: 24px;
              margin: 24px 0;
              border-left: 4px solid #9333ea;
            }
            .job-title {
              font-size: 24px;
              font-weight: 700;
              color: #1f2937;
              margin: 0 0 16px 0;
            }
            .job-details {
              display: flex;
              flex-wrap: wrap;
              gap: 16px;
              margin-bottom: 16px;
              font-size: 14px;
              color: #6b7280;
            }
            .job-detail {
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .job-description {
              color: #4b5563;
              line-height: 1.6;
              margin-top: 16px;
            }
            .cta {
              text-align: center;
              margin: 32px 0;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
              color: white;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              transition: transform 0.2s ease;
            }
            .cta-button:hover {
              transform: translateY(-2px);
            }
            .footer {
              background: #f9fafb;
              padding: 24px;
              text-align: center;
              font-size: 14px;
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
            }
            .footer a {
              color: #9333ea;
              text-decoration: none;
            }
            .footer a:hover {
              text-decoration: underline;
            }
            @media (max-width: 600px) {
              .job-details {
                flex-direction: column;
                gap: 8px;
              }
              .container {
                margin: 0 16px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 New Opportunity</h1>
              <p class="subtitle">A perfect match for your profile</p>
            </div>
            
            <div class="content">
              <p class="greeting">Hi ${name},</p>
              
              <p>We found a new job opportunity that matches your sales expertise and preferences:</p>
              
              <div class="job-card">
                <h2 class="job-title">${jobTitle}</h2>
                
                <div class="job-details">
                  ${priceRange ? `<div class="job-detail">💰 ${priceRange}</div>` : ''}
                  ${industry ? `<div class="job-detail">🏢 ${industry}</div>` : ''}
                  ${teamSize ? `<div class="job-detail">👥 ${teamSize}</div>` : ''}
                </div>
                
                ${companyOverview ? `<div class="job-description">${companyOverview}</div>` : ''}
              </div>
              
              <div class="cta">
                <a href="${baseUrl}/dashboard/opportunities/${jobId}" class="cta-button">
                  View Full Details & Apply
                </a>
              </div>
              
              <p>This opportunity was specifically selected for you based on your profile and notification preferences. Don't miss out on this chance to advance your sales career!</p>
            </div>
            
            <div class="footer">
              <p>
                You're receiving this email because you're subscribed to job notifications.<br>
                <a href="${baseUrl}/dashboard/settings/notifications">Manage your notification preferences</a>
              </p>
              <p style="margin-top: 16px;">
                <strong>Helios Recruit</strong> - Connecting sales talent with opportunity
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error('Resend email error:', error);
    throw error;
  }
}

export async function sendInvitationEmail({
  to,
  salesProfessionalName,
  jobTitle,
  company,
  industry,
  priceRange,
  commission,
  remote,
  recruiterName,
  message
}: InvitationEmailProps) {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ||
      'http://localhost:3000'

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [to],
      subject: `Interview Invitation: ${jobTitle} at ${company}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Interview Invitation</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f8fafc;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
              color: white;
              padding: 32px 24px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .header .subtitle {
              margin: 8px 0 0 0;
              opacity: 0.9;
              font-size: 16px;
            }
            .content {
              padding: 32px 24px;
            }
            .greeting {
              font-size: 18px;
              margin-bottom: 24px;
              color: #1f2937;
            }
            .job-card {
              background: #f9fafb;
              border-radius: 12px;
              padding: 24px;
              margin: 24px 0;
              border-left: 4px solid #9333ea;
            }
            .job-title {
              font-size: 24px;
              font-weight: 700;
              color: #1f2937;
              margin: 0 0 16px 0;
            }
            .job-details {
              display: flex;
              flex-wrap: wrap;
              gap: 16px;
              margin-bottom: 16px;
              font-size: 14px;
              color: #6b7280;
            }
            .job-detail {
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .message-box {
              background: #e0e7ff;
              border-radius: 8px;
              padding: 16px;
              margin: 20px 0;
              font-style: italic;
              color: #4c1d95;
            }
            .cta {
              text-align: center;
              margin: 32px 0;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
              color: white;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              transition: transform 0.2s ease;
            }
            .cta-button:hover {
              transform: translateY(-2px);
            }
            .footer {
              background: #f9fafb;
              padding: 24px;
              text-align: center;
              font-size: 14px;
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
            }
            .footer a {
              color: #9333ea;
              text-decoration: none;
            }
            .footer a:hover {
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Interview Invitation</h1>
              <p class="subtitle">You've been selected for an interview!</p>
            </div>
            
            <div class="content">
              <p class="greeting">Hi ${salesProfessionalName},</p>
              
              <p>Great news! You've been invited to interview for the following position:</p>
              
              <div class="job-card">
                <h2 class="job-title">${jobTitle}</h2>
                
                <div class="job-details">
                  <div class="job-detail">🏢 ${company}</div>
                  <div class="job-detail">💰 ${priceRange}</div>
                  <div class="job-detail">🏭 ${industry}</div>
                  <div class="job-detail">📍 ${remote ? 'Remote' : 'On-site'}</div>
                  <div class="job-detail">💸 Commission: ${commission}</div>
                </div>
              </div>
              
              ${message ? `
              <div class="message-box">
                <strong>Message from ${recruiterName}:</strong><br>
                "${message}"
              </div>
              ` : ''}
              
              <div class="cta">
                <a href="${baseUrl}/dashboard/invites" class="cta-button">
                  Schedule Your Interview
                </a>
              </div>
              
              <p>Click the button above to view the invitation and schedule your interview at a time that works best for you.</p>
              
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Choose a convenient time slot for your interview</li>
                <li>You'll receive a calendar invite with a Google Meet link</li>
                <li>Prepare for your interview with ${company}</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>
                Best of luck with your interview!<br>
                <strong>The Helios Recruit Team</strong>
              </p>
              <p style="margin-top: 16px; font-size: 12px;">
                If you have any questions, please contact us through the platform.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      throw new Error(`Failed to send invitation email: ${error.message}`);
    }

    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error('Resend invitation email error:', error);
    throw error;
  }
}

export async function sendBookingConfirmationEmail({
  to,
  recruiterName,
  salesProfessionalName,
  jobTitle,
  company,
  scheduledDate,
  scheduledTime,
  meetingLink
}: BookingConfirmationEmailProps) {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ||
      'http://localhost:3000'

    const formattedDate = new Date(scheduledDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [to],
      subject: `Interview Scheduled: ${jobTitle} - ${salesProfessionalName}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Interview Scheduled</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f8fafc;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
              color: white;
              padding: 32px 24px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .content {
              padding: 32px 24px;
            }
            .greeting {
              font-size: 18px;
              margin-bottom: 24px;
              color: #1f2937;
            }
            .schedule-card {
              background: #f9fafb;
              border-radius: 12px;
              padding: 24px;
              margin: 24px 0;
              border-left: 4px solid #9333ea;
            }
            .schedule-details {
              margin: 16px 0;
            }
            .schedule-detail {
              display: flex;
              align-items: center;
              gap: 8px;
              margin: 12px 0;
              font-size: 16px;
            }
            .schedule-detail strong {
              min-width: 100px;
            }
            .meeting-link {
              display: inline-block;
              background: #9333ea;
              color: white;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 6px;
              margin-top: 16px;
              font-weight: 600;
            }
            .action-items {
              background: #e0e7ff;
              border-radius: 8px;
              padding: 20px;
              margin: 24px 0;
            }
            .action-items h3 {
              margin-top: 0;
              color: #4c1d95;
            }
            .footer {
              background: #f9fafb;
              padding: 24px;
              text-align: center;
              font-size: 14px;
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📅 Interview Scheduled</h1>
            </div>
            
            <div class="content">
              <p class="greeting">Hi ${recruiterName},</p>
              
              <p>Great news! ${salesProfessionalName} has scheduled their interview for the ${jobTitle} position at ${company}.</p>
              
              <div class="schedule-card">
                <h2 style="margin-top: 0;">Interview Details</h2>
                
                <div class="schedule-details">
                  <div class="schedule-detail">
                    <strong>📅 Date:</strong>
                    <span>${formattedDate}</span>
                  </div>
                  <div class="schedule-detail">
                    <strong>🕐 Time:</strong>
                    <span>${scheduledTime}</span>
                  </div>
                  <div class="schedule-detail">
                    <strong>👤 Candidate:</strong>
                    <span>${salesProfessionalName}</span>
                  </div>
                  <div class="schedule-detail">
                    <strong>💼 Position:</strong>
                    <span>${jobTitle}</span>
                  </div>
                  <div class="schedule-detail">
                    <strong>🏢 Company:</strong>
                    <span>${company}</span>
                  </div>
                </div>
                
                ${meetingLink ? `
                <a href="${meetingLink}" class="meeting-link">
                  Join Google Meet
                </a>
                ` : ''}
              </div>
              
              <div class="action-items">
                <h3>Next Steps</h3>
                <ul>
                  <li>A calendar invite has been sent to all participants</li>
                  <li>Please review the candidate's profile before the interview</li>
                  <li>Prepare relevant questions about the ${jobTitle} role</li>
                  <li>Join the meeting 5 minutes early to ensure everything works</li>
                </ul>
              </div>
              
              <p>You can manage this interview and view all scheduled interviews in your dashboard.</p>
              
              <p style="text-align: center; margin-top: 32px;">
                <a href="${baseUrl}/recruiter/dashboard" style="color: #9333ea; text-decoration: none; font-weight: 600;">
                  Go to Dashboard →
                </a>
              </p>
            </div>
            
            <div class="footer">
              <p>
                <strong>Helios Recruit</strong><br>
                Connecting sales talent with opportunity
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      throw new Error(`Failed to send booking confirmation email: ${error.message}`);
    }

    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error('Resend booking confirmation email error:', error);
    throw error;
  }
} 