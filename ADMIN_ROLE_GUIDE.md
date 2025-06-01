# Admin Role Guide

## Overview

The admin role in Helios Recruit provides complete oversight and management capabilities. Admins can:
- Do everything recruiters can do (post jobs, manage applicants, message candidates)
- Do everything sales professionals can do (apply to jobs, book interviews, message recruiters)
- See ALL activity logs from all users in real-time
- Manage user roles and permissions
- Access comprehensive analytics and reports

## Setting Up the Admin Role

### 1. Run the Database Migration

First, apply the admin role migration to your database:

```bash
supabase migration up
```

This will:
- Add the 'admin' role to the users table constraint
- Create the activity_logs table for tracking all user actions
- Set up RLS policies giving admins access to everything
- Create admin dashboard views
- Set up automatic activity logging triggers

### 2. Create Your First Admin

To make an existing user an admin, run this SQL in your Supabase SQL Editor:

```sql
-- Replace with the actual email
UPDATE users 
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

Or use the provided script:
1. Edit `create_admin_user.sql` and replace the email
2. Run it in Supabase SQL Editor

### 3. Access the Admin Dashboard

Once you're an admin, you can access the admin dashboard at `/admin`.

## Admin Features

### 1. Activity Logs (`/admin/activity`)
- Real-time activity tracking for all users
- Filter by role, action type, or entity
- Search by user email or content
- Export logs to CSV
- Automatic activity tracking includes:
  - Job creation/updates
  - Application submissions
  - Status changes
  - Messages sent
  - Interview scheduling
  - User logins/logouts

### 2. User Management (`/admin/users`)
- View all users with their activity statistics
- Change user roles (admin/recruiter/sales-professional)
- Search and filter users
- See last activity and total actions
- Quick access to individual user activity logs

### 3. Dashboard Overview (`/admin`)
- Platform statistics at a glance
- Recent activity feed
- Most active users
- Quick links to all sections

### 4. Full Platform Access
Admins can access all features:
- `/recruiter/*` - All recruiter features
- `/dashboard/*` - All sales professional features
- `/admin/*` - Admin-only features

## Activity Logging Details

The system automatically logs these activities:

### Job Activities
- `created` - When a job is posted
- `updated` - When job details are modified
- `status_changed` - When job status changes

### Applicant Activities
- `applied` - When someone applies to a job
- `status_changed` - When applicant status is updated

### Communication Activities
- `sent_message` - When messages are sent
- `scheduled_interview` - When interviews are booked
- `interview_status_changed` - When interview status updates

### Custom Activity Logging

To log custom activities in your code:

```typescript
// In your API routes or server actions
await supabase.rpc('log_activity', {
  p_action_type: 'custom_action',
  p_entity_type: 'entity_name',
  p_entity_id: '123',
  p_metadata: { additional: 'data' }
})
```

## Security Considerations

### Row Level Security (RLS)
- All tables have RLS policies updated to include admin access
- Admins bypass normal user restrictions
- Admin role cannot be self-assigned (must be set by another admin or database owner)

### Activity Privacy
- All user actions are logged and visible to admins
- Users can see their own activity logs
- Only admins can see activity logs from other users

## Best Practices

1. **Limited Admin Accounts** - Only create admin accounts for trusted users
2. **Regular Monitoring** - Check activity logs regularly for unusual behavior
3. **Role Management** - Use the user management interface to change roles rather than direct SQL
4. **Data Export** - Regularly export activity logs for compliance/backup

## Troubleshooting

### Can't Access Admin Dashboard
1. Verify your role: 
   ```sql
   SELECT role FROM users WHERE email = 'your-email@example.com';
   ```
2. Clear your browser cache and cookies
3. Sign out and sign back in

### Activity Logs Not Showing
1. Check if activity_logs table exists
2. Verify RLS policies are applied
3. Ensure triggers are active

### Real-time Updates Not Working
1. Check browser console for WebSocket errors
2. Verify Supabase Realtime is enabled for activity_logs table
3. Check your Supabase plan limits

## Future Enhancements

Consider adding:
- Email alerts for specific activities
- Advanced analytics dashboards
- Bulk user management operations
- Activity log retention policies
- Role-based activity filtering
- Audit reports generation 