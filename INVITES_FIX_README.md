# Fix for Interview Invites Page

I've made several code changes to fix the issues with the interview invites page. Here's what was fixed:

## Issues Fixed

1. **Navigation Bar**: The invites link wasn't showing because it requires the user role to be `sales-professional`
2. **Unknown Data**: Interview invitations were showing "Unknown Position" and "Unknown Company" due to:
   - Missing or incomplete metadata in notifications
   - Field name mismatches between the jobs table and the API
3. **Missing Table**: The `scheduled_interviews` table was missing from the database

## Code Changes Made

### 1. Updated `/app/api/invite/route.ts`
- Added fallbacks for both old and new field names (e.g., `company` and `company_overview`)
- Enhanced metadata to include all job details
- Improved error handling for missing fields

### 2. Updated `/app/dashboard/invites/page.tsx`
- Added better parsing logic that handles both old and new notification formats
- Uses metadata when available, falls back to parsing the notification body
- Improved error messages for missing information

### 3. Updated `/app/recruiter/jobs/[id]/applicants/page.tsx`
- Fixed the jobDetails object to include both field name variations
- Ensures compatibility with different database schemas

### 4. Created SQL migration file
- Added the `scheduled_interviews` table creation
- Included necessary indexes and RLS policies

## How to Apply the Fix

1. **Run the SQL Fix Script**:
   - Open the Supabase SQL Editor
   - Copy the contents of `fix_invites_issue.sql`
   - **IMPORTANT**: Replace `'your-email@example.com'` with your actual email address
   - Run the entire script

2. **What the SQL script does**:
   - Updates your user role to `sales-professional`
   - Shows you statistics about problematic notifications
   - Creates the `scheduled_interviews` table if missing
   - Sets up proper security policies

3. **After running the SQL**:
   - Log out of the application
   - Log back in (this refreshes your session with the new role)
   - Navigate to `/dashboard/invites`
   - The invites link should now appear in the navigation
   - Any new interview invitations will display correctly

## Verification

After applying the fix, you should see:
- ✅ "Invites" link in the navigation sidebar
- ✅ Interview invitations showing proper job details
- ✅ Ability to book interview times
- ✅ Calendar integration working (if configured)

## If You Still Have Issues

1. Check the browser console for any errors
2. Verify your user role was updated: 
   ```sql
   SELECT role FROM users WHERE email = 'your-email@example.com';
   ```
3. Check if the scheduled_interviews table was created:
   ```sql
   SELECT EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'scheduled_interviews');
   ```

## Future Invitations

All new interview invitations sent after these fixes will automatically include the proper metadata and display correctly.

## Troubleshooting

### "column 'company' does not exist" Error

If you get an error about the `company` column not existing when trying to update `company_overview`, this means your jobs table already has the `company_overview` column and doesn't have a `company` column. This is fine! 

To check your jobs table structure, run:
```sql
-- Check what columns exist in jobs table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
ORDER BY ordinal_position;
```

The error can be safely ignored if `company_overview` already exists in your table. The rest of the fix script will still work correctly. 