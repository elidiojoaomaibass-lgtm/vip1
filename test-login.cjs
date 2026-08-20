const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function testLogin() {
  const email = 'dzin1850@gmail.com';
  const password = 'Albertina198211';

  console.log('1. Trying to sign in with password...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    console.error('❌ Auth Error:', authError.message);
    return;
  }
  
  if (!authData.user) {
    console.error('❌ No user returned');
    return;
  }
  
  console.log('✅ Sign in successful. User ID:', authData.user.id);
  console.log('User confirmed at:', authData.user.email_confirmed_at);

  console.log('2. Checking admin table...');
  const { data: adminData, error: adminError } = await supabase
    .from('admins')
    .select('*')
    .eq('user_id', authData.user.id)
    .eq('is_active', true)
    .single();

  if (adminError) {
    console.error('❌ Admin check error:', adminError.message);
    return;
  }
  
  if (!adminData) {
    console.error('❌ User is not an active admin');
    return;
  }
  
  console.log('✅ Admin check successful:', adminData);
  
  console.log('3. Checking OTP step...');
  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  });
  
  if (otpError) {
    console.error('❌ OTP Error:', otpError.message);
    return;
  }
  
  console.log('✅ OTP sent successfully!');
}

testLogin();
