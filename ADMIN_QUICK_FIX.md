# Admin Quick Fix Guide

## The Issue
Your user is set as admin in the database, but the auth metadata doesn't know about it, which causes routing issues.

## Quick Solution

### Step 1: Update Your Auth Metadata
Run this SQL in Supabase (replace with YOUR email):

```sql
DO $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = 'thomas@heliosscale.com';  -- YOUR EMAIL HERE
  
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    '{"role": "admin"}'::jsonb
  WHERE id = user_id;
END $$;
```

### Step 2: Test Locally First
1. Run your app locally: `npm run dev`
2. Log out and log back in (important!)
3. You should be redirected to `/admin`
4. You should see the admin dashboard with the purple admin navigation

### Step 3: Deploy to Production
```bash
git add .
git commit -m "Add admin dashboard and fix admin routing"
git push
```

Wait for Vercel to deploy, then test on production.

## What This Fixed
1. **Middleware**: Now properly checks role from database AND handles admin routing
2. **Admin Layout**: Custom layout with admin-specific navigation (purple theme)
3. **Navigation**: Dedicated admin navigation with all admin tools

## Admin Features You Now Have
- `/admin` - Dashboard with platform statistics
- `/admin/activity` - View all user activity logs
- `/admin/users` - Manage all users and change roles
- `/admin/jobs` - View all jobs
- `/admin/applicants` - View all applicants
- `/admin/messages` - View all messages
- `/admin/interviews` - View all interviews

## Still Having Issues?
1. Make sure you logged out and back in after updating metadata
2. Check browser console for errors
3. Try clearing your browser cache/cookies for the site 