# Resend Email Setup for Helios Recruit

## Overview

Helios Recruit now sends automated email notifications using Resend for:
1. **Interview Invitations** - When recruiters invite sales professionals to interview
2. **Booking Confirmations** - When sales professionals schedule their interviews

## Email Types

### 1. Interview Invitation Email
- **Sent to**: Sales professional
- **When**: Recruiter sends an interview invitation
- **Contains**: Job details, recruiter info, and link to schedule interview

### 2. Booking Confirmation Email
- **Sent to**: Recruiter
- **When**: Sales professional books an interview time
- **Contains**: Interview details, meeting link, and preparation tips

### 3. Interview Reminder Emails (Existing)
- **24-hour reminder**: Sent to both parties 1 day before
- **2-hour reminder**: Sent to both parties 2 hours before

## Setup Instructions

### 1. Sign up for Resend
1. Go to [https://resend.com](https://resend.com)
2. Create an account
3. Complete email verification

### 2. Add and Verify Your Domain
1. In Resend dashboard, go to "Domains"
2. Click "Add Domain"
3. Enter your domain (e.g., `heliosrecruit.com`)
4. Add the DNS records shown by Resend to your domain provider
5. Wait for verification (usually takes a few minutes)

### 3. Get Your API Key
1. In Resend dashboard, go to "API Keys"
2. Click "Create API Key"
3. Give it a name (e.g., "Production" or "Development")
4. Copy the API key

### 4. Configure Environment Variables

Add these to your `.env.local` file (development) or your production environment:

```bash
# Required: Your Resend API key
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Optional: Custom sender email (must be from verified domain)
# If not set, uses Resend's sandbox domain for development
RESEND_FROM="Helios Recruit <notifications@heliosrecruit.com>"

# Required for links in emails
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 5. Test Email Sending

For development, you can use Resend's sandbox domain without verifying your own domain:
- Emails will be sent from `onboarding@resend.dev`
- They may land in spam folders
- Perfect for testing before domain verification

## Production Checklist

- [ ] Domain verified in Resend
- [ ] Production API key created
- [ ] `RESEND_API_KEY` set in production environment
- [ ] `RESEND_FROM` set with verified domain email
- [ ] `NEXT_PUBLIC_APP_URL` set to production URL
- [ ] SPF, DKIM, and DMARC records configured for better deliverability

## Troubleshooting

### Emails not sending
1. Check API key is correct
2. Verify domain is confirmed in Resend
3. Check application logs for error messages

### Emails landing in spam
1. Verify your domain in Resend
2. Set up SPF, DKIM, and DMARC records
3. Use a professional sender address
4. Avoid spam trigger words in content

### Links not working in emails
1. Ensure `NEXT_PUBLIC_APP_URL` is set correctly
2. Check the URL includes protocol (https://)
3. Verify the paths exist in your application

## Email Templates Location

The email templates are defined in:
- `/lib/email/resend.ts` - Contains all email template functions

To modify email content or styling, edit the HTML in these functions.

## API Endpoints

- **POST** `/api/invite` - Sends invitation email when inviting sales professional
- **POST** `/api/notifications/booking-confirmation` - Sends booking confirmation to recruiter
- **POST** `/api/notifications/interview-email` - Sends interview scheduled emails
- **GET** `/api/cron/interview-reminders` - Sends reminder emails (requires cron setup)

## Best Practices

1. **Always handle email errors gracefully** - Email sending should not block core functionality
2. **Log email events** - Track sends, bounces, and complaints
3. **Use professional sender addresses** - Avoid noreply@ addresses when possible
4. **Test with real email clients** - Gmail, Outlook, Apple Mail, etc.
5. **Monitor your sender reputation** - Check Resend dashboard regularly

## Support

For Resend-specific issues:
- Documentation: https://resend.com/docs
- Support: support@resend.com

For Helios Recruit integration issues:
- Check application logs
- Review this documentation
- Contact your development team 