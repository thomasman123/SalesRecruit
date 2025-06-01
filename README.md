# HeliosRecruit

A modern platform connecting top sales talent with opportunities at leading companies.

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Email**: Resend (Email notifications)
- **Calendar**: Google Calendar API (Interview scheduling)
- **Deployment**: Vercel (Frontend), Supabase (Backend)

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   # .env.local
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   
   # Email notifications (optional for development)
   RESEND_API_KEY=your_resend_api_key
   RESEND_FROM="Your App <notifications@yourdomain.com>"
   
   # For email links
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

## Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `RESEND_API_KEY`
   - `RESEND_FROM`
   - `NEXT_PUBLIC_APP_URL`

### Backend (Supabase)

1. Create production project at supabase.com
2. Run migrations:
   ```bash
   npx supabase link --project-ref your_project_ref
   npx supabase db push
   ```

### Email Setup (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain
3. Add API key to environment variables
4. See `/docs/resend-email-setup.md` for detailed instructions

Production URL: https://heliosrecruit.com

## Features

- **Authentication**: Email-based signup/login with role selection
- **Role-Based Access**: Separate dashboards for recruiters and sales professionals
- **Job Management**: Post, edit, and manage job listings
- **Applicant Tracking**: Review and manage job applications
- **Messaging**: Built-in communication system
- **Profile Management**: Comprehensive profile editing
- **Email Notifications**: 
  - Interview invitations to sales professionals
  - Booking confirmations to recruiters
  - Interview reminders (24-hour and 2-hour)
- **Calendar Integration**: Google Calendar sync with automatic meeting links

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT License - see LICENSE file for details
