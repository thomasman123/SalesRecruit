import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function addTimezoneColumn() {
  try {
    console.log('Checking if timezone column exists...')
    
    // First, let's check the current schema
    const { data: users, error: checkError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (checkError) {
      console.error('Error checking users table:', checkError)
      return
    }

    if (users && users.length > 0 && 'timezone' in users[0]) {
      console.log('Timezone column already exists!')
      console.log('Current user timezone:', users[0].timezone)
      return
    }

    console.log('Timezone column not found. Please run the following SQL manually in Supabase dashboard:')
    console.log('\n======= SQL to run in Supabase SQL Editor =======')
    console.log(`
-- Add timezone column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_timezone ON public.users(timezone);

-- Update existing users to default timezone
UPDATE public.users 
SET timezone = 'America/New_York' 
WHERE timezone IS NULL;
    `)
    console.log('======= End SQL =======\n')
    console.log('Steps:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Paste and run the SQL above')
    console.log('4. The timezone feature will then work properly')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

addTimezoneColumn() 