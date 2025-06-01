-- Script to create an admin user
-- Replace 'your-email@example.com' with the email of the user you want to make admin

-- 1. Check if the user exists
SELECT id, email, name, role 
FROM users 
WHERE email = 'your-email@example.com';

-- 2. Update the user's role to admin
UPDATE users 
SET role = 'admin'
WHERE email = 'your-email@example.com';

-- 3. Verify the update
SELECT id, email, name, role 
FROM users 
WHERE email = 'your-email@example.com';

-- 4. Check admin dashboard access
SELECT 
  'User can now access /admin dashboard' as message,
  'They can see all user activities' as capability_1,
  'They can manage all users roles' as capability_2,
  'They can access all recruiter and sales features' as capability_3;

-- 5. Show current admin count
SELECT 
  role, 
  COUNT(*) as count 
FROM users 
GROUP BY role 
ORDER BY role; 