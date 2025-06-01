# Simple Admin Setup Instructions

Since copy/paste is having issues, I've split the migration into smaller parts. Follow these steps:

## Step 0: Check Current Status (NEW!)

If you're getting "already exists" errors, first check what's already set up:

1. Go to Supabase SQL Editor
2. Run `check_admin_setup_status.sql` to see what's already installed
3. This will tell you which parts are already set up

## Step 1: Run the Migrations

### If you got errors before, use the SAFE versions:

### Part 1: Core Setup (SAFE VERSION)
- Open `admin_migration_part1_safe.sql` (this handles existing objects)
- Copy the contents
- Paste into SQL Editor
- Click "Run"
- You should see "Part 1 (SAFE VERSION) completed successfully!"

### Part 2: Update Permissions
- Open `admin_migration_part2.sql`
- Copy the contents  
- Paste into SQL Editor
- Click "Run"
- You should see "Part 2 completed successfully!"

### Part 3: Auth Functions
- Open `admin_migration_part3.sql`
- Copy the contents
- Paste into SQL Editor
- Click "Run"
- You should see "Part 3 completed successfully!"

## Step 2: Make Yourself Admin

1. Open `make_me_admin.sql`
2. Replace `'your.email@example.com'` with your actual email address
3. Copy and paste into SQL Editor
4. Click "Run"
5. You should see your user with role = 'admin'

## Step 3: Test It

1. Go to your Helios Recruit app
2. You should be redirected to `/admin` 
3. You'll see the admin dashboard with:
   - User statistics
   - Activity logs
   - User management

## Troubleshooting

If you get "already exists" errors:
- Use the `admin_migration_part1_safe.sql` instead of the regular part1
- Or run `check_admin_setup_status.sql` to see what's already set up

If `/admin` gives a 404:
- Make sure all 3 migration parts ran successfully
- Make sure your user role is set to 'admin'
- Try logging out and back in

If copy/paste still doesn't work:
- Try copying smaller sections at a time
- Or manually type the SQL commands (they're not too long) 