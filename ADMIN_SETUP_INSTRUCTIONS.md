# Admin Role Setup Instructions

Due to migration conflicts, please follow these steps to set up the admin role:

## 1. Run the Migration in Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Open the file `run_admin_migrations.sql` (in your project root)
4. Copy the entire contents
5. Paste it into the SQL Editor
6. Click "Run" to execute

This will:
- Add the admin role to your database
- Create activity logging tables
- Set up all necessary permissions
- Create admin dashboard views

## 2. Create Your First Admin User

After running the migration, create an admin user by running this SQL in the SQL Editor:

```sql
-- Replace with your actual email address
UPDATE users 
SET role = 'admin'
WHERE email = 'your-email@example.com';

-- Verify it worked
SELECT id, email, name, role 
FROM users 
WHERE email = 'your-email@example.com';
```

## 3. Test the Admin Dashboard

1. Log out and log back in (or clear your browser cache)
2. Navigate to `/admin` 
3. You should see the admin dashboard with:
   - Platform statistics
   - Recent activity logs
   - Most active users

## 4. Available Admin Pages

- `/admin` - Dashboard overview
- `/admin/activity` - Real-time activity logs
- `/admin/users` - User management
- `/admin/jobs` - All jobs (coming soon)
- `/admin/applicants` - All applicants (coming soon)
- `/admin/messages` - All messages (coming soon)
- `/admin/interviews` - All interviews (coming soon)
- `/admin/analytics` - Analytics (coming soon)
- `/admin/reports` - Reports (coming soon)

## 5. What Admins Can Do

- ✅ Access all recruiter features
- ✅ Access all sales professional features
- ✅ View all user activity logs in real-time
- ✅ Change user roles
- ✅ Export activity logs to CSV
- ✅ See platform-wide statistics

## Troubleshooting

If you can't access the admin dashboard:

1. Check your role in the database:
   ```sql
   SELECT role FROM users WHERE email = 'your-email@example.com';
   ```

2. Clear your browser cache and cookies

3. Sign out and sign back in

4. Check the browser console for any errors

## Notes

- Activity logging starts immediately after the migration runs
- Past activities won't be logged (only new ones)
- The admin role cannot be self-assigned through the UI (database only)
- Admins bypass all Row Level Security policies 