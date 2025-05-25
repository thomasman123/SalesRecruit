# SalesRecruit

A modern platform connecting sales talent with opportunities.

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
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

### Backend (Supabase)

1. Create production project at supabase.com
2. Run migrations:
   ```bash
   npx supabase link --project-ref your_project_ref
   npx supabase db push
   ```

## Features

- **Authentication**: Email-based signup/login with role selection
- **Role-Based Access**: Separate dashboards for recruiters and sales professionals
- **Job Management**: Post, edit, and manage job listings
- **Applicant Tracking**: Review and manage job applications
- **Messaging**: Built-in communication system
- **Profile Management**: Comprehensive profile editing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT License - see LICENSE file for details
