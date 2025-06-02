# Applicants Page Features

## Overview
The applicants page has been completely redesigned to provide a cleaner, more organized view of job applicants with AI-powered scoring capabilities and detailed profile viewing.

## Key Features

### 1. Three-Category Organization
Applicants are now automatically organized into three clear categories:
- **New Applicants**: Candidates who have applied but haven't been invited to interview yet
- **Invited to Interview**: Candidates who have been sent interview invitations but haven't scheduled yet
- **Interview Scheduled**: Candidates who have booked their interview time

### 2. AI Scoring System
- Each applicant can be scored using OpenAI's GPT-3.5 model
- Scores range from 0-100 based on job fit
- The AI provides up to 4 reasons explaining the score
- Scores are displayed prominently with color coding:
  - Green (80-100): Excellent fit
  - Yellow (60-79): Good fit
  - Orange (40-59): Average fit
  - Red (0-39): Poor fit

### 3. Sorting Options
Users can sort applicants within each category by:
- **Newest First** (default)
- **Oldest First**
- **Highest AI Score**
- **Lowest AI Score**

### 4. Clean, Simple Interface
- Removed complex filters and status dropdowns
- Focus on essential information: name, email, location, application date
- AI scores displayed prominently when available
- Single action button: Invite to Interview (messaging removed)
- Clickable cards to view full applicant profiles

### 5. Interview Status Display
- For candidates with scheduled interviews, the date and time are clearly displayed
- Visual indicator (green checkmark) shows interview is confirmed

### 6. Detailed Applicant Profiles
Click on any applicant card to view their complete profile in a modal with three tabs:
- **Profile Tab**: Sales style, highest ticket, tools/CRM experience, video introduction
- **Experience Tab**: Full experience and background information
- **Notes Tab**: Internal notes about the applicant

## Backend Integration

### AI Scoring
- Endpoint: `/api/score-applicant`
- Automatically triggered when new applicants apply
- Can be manually triggered for existing applicants
- Stores score and reasons in the database

### Invitation System
- Uses the existing notifications system
- Tracks invitations through the `notifications` table
- Links to the candidate's ability to schedule interviews

### Interview Tracking
- Uses the `scheduled_interviews` table
- Displays scheduled interview information inline

## Technical Implementation

### Database Schema
The following fields are used:
- `applicants.score`: AI score (0-100)
- `applicants.score_reasons`: Array of reasons for the score
- `applicants.experience`: Sales experience details
- `applicants.highest_ticket`: Highest value sale
- `applicants.sales_style`: Selling approach
- `applicants.tools`: CRM and tools experience
- `applicants.video_url`: Video introduction link
- `notifications`: Tracks interview invitations
- `scheduled_interviews`: Tracks booked interviews

### Performance
- All data is fetched server-side for optimal performance
- Efficient queries using maps for invitation/interview lookups
- Real-time updates when actions are performed

## User Interaction Flow
1. Recruiters see applicants organized into three categories
2. They can sort by date or AI score
3. Clicking on an applicant opens their full profile
4. From the profile or the list, they can invite candidates to interview
5. Once invited, applicants move to the "Invited" category
6. When applicants book interviews, they move to "Interview Scheduled" 