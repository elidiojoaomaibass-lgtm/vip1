import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase vars missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing auth_codes table...');
  
  // Try selecting to see if it exists
  const { data, error } = await supabase.from('auth_codes').select('*').limit(1);
  if (error) {
    console.error('Error selecting auth_codes:', error.message, error.details, error.hint, error.code);
  } else {
    console.log('auth_codes exists, rows:', data?.length);
  }
}

test();
