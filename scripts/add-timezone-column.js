const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables')
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
      return
    }

    console.log('Timezone column not found. Please run the following SQL manually in Supabase dashboard:')
    console.log('\n--- SQL to run ---')
    console.log(`
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';
CREATE INDEX IF NOT EXISTS idx_users_timezone ON public.users(timezone);
UPDATE public.users SET timezone = 'America/New_York' WHERE timezone IS NULL;
    `)
    console.log('--- End SQL ---\n')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

addTimezoneColumn() 