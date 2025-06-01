# Fix for Interview Invites Not Showing in Dashboard

This document explains how to fix the issue where interview invitations are sent but don't appear in the `/dashboard/invites` page.

## Root Causes

1. **Missing RLS Policies**: The notifications table didn't have Row Level Security (RLS) policies, preventing sales professionals from viewing their own notifications
2. **Missing Metadata**: The TypeScript types didn't include the metadata field for notifications
3. **User Role Issues**: The user's role needs to be properly set to "sales-professional" in the database
4. **User ID Mismatch**: Applicants without a linked user account couldn't receive invitations

## What Was Fixed

### 1. Updated User Hook (`/lib/hooks/use-user.ts`)
- Now fetches the user's role from the `users` table instead of just auth metadata
- Ensures the navigation shows the "Invites" link for sales professionals

### 2. Fixed Applicant Queries (`/app/recruiter/jobs/[id]/applicants/page.tsx`)
- Added user relationship to the applicant query
- Fixed the invite data to use the correct `user_id` field
- Added validation to ensure applicants have a linked user account
- Added better error handling and logging

### 3. Created RLS Migration (`/supabase/migrations/20250530090000_fix_notifications_rls.sql`)
- Enables RLS on the notifications table
- Creates policies allowing users to view and update their own notifications
- Ensures the metadata column exists

### 4. Updated Database Types (`/lib/supabase/database.types.ts`)
- Added the metadata field to the notifications table type

## How to Apply the Fix

### Step 1: Run the SQL Fix Script

1. Open your Supabase SQL Editor
2. Copy the contents of `fix_invites_visibility.sql`
3. **IMPORTANT**: Replace `'your-email@example.com'` with your actual email address throughout the script
4. Run the entire script

### Step 2: Deploy the Code Changes

The following files have been updated and need to be deployed:
- `/lib/hooks/use-user.ts`
- `/app/recruiter/jobs/[id]/applicants/page.tsx`
- `/lib/supabase/database.types.ts`

### Step 3: Test the Fix

1. Log out and log back in (this refreshes your session)
2. Navigate to `/dashboard` - you should see the "Invites" link in the navigation
3. Have a recruiter send you a test invitation
4. Check `/dashboard/invites` - the invitation should appear

## Troubleshooting

### "Cannot send invitation" Error
This means the applicant doesn't have a `user_id` linked to their profile. The applicant needs to:
1. Create an account with the same email they used to apply
2. Have their role set to "sales-professional"

### Invites Still Not Showing
1. Check the browser console for errors
2. Verify your role in the database:
   ```sql
   SELECT role FROM users WHERE email = 'your-email@example.com';
   ```
3. Check if you have any notifications:
   ```sql
   SELECT COUNT(*) FROM notifications 
   WHERE user_id = (SELECT id FROM users WHERE email = 'your-email@example.com');
   ```

### Check RLS Policies
Verify RLS is enabled and policies exist:
```sql
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'notifications';
```

## Prevention

To prevent this issue for new users:
1. Ensure all sales professionals have their role properly set when they sign up
2. Ensure applicants have a linked user account before sending invitations
3. Always test with both recruiter and sales professional accounts

## Additional Notes

- The fix includes comprehensive logging in the browser console to help debug issues
- Old invitations without metadata will be given basic metadata to make them visible
- The scheduled_interviews table is created if it doesn't exist
- All necessary indexes are created for performance 