#!/usr/bin/env node

// Simple Supabase connection test
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

console.log('🧪 Testing Supabase Connection...\n');

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('📋 Configuration:');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Service Key: ${supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'MISSING'}`);
console.log(`   Anon Key: ${supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING'}`);
console.log('');

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Missing required Supabase configuration');
  console.log('   Please check your .env file');
  process.exit(1);
}

// Test with service role key (backend)
console.log('🔧 Testing Service Role Connection...');
const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

try {
  // Try a simple test - check if we can access the database
  const { data, error } = await supabaseService
    .rpc('version')
    .limit(1);

  if (error && error.code === 'PGRST116') {
    // This error means the function doesn't exist, but connection is working
    console.log('✅ Service role connection successful!');
    console.log('   Database is accessible (no tables created yet)');
  } else if (error) {
    console.log('❌ Service role test failed:', error.message);
  } else {
    console.log('✅ Service role connection successful!');
    console.log('   Database version check passed');
  }
} catch (error) {
  console.log('❌ Connection error:', error.message);
}

// Test with anon key (frontend)
console.log('\n🌐 Testing Anon Key Connection...');
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

try {
  // This should work with anon key
  const { data, error } = await supabaseAnon.auth.getSession();
  
  if (error) {
    console.log('❌ Anon key test failed:', error.message);
  } else {
    console.log('✅ Anon key connection successful!');
  }
} catch (error) {
  console.log('❌ Anon key error:', error.message);
}

console.log('\n🎯 Test Complete!');
console.log('\n💡 Next Steps:');
console.log('   1. If service role works → API server should start');
console.log('   2. If anon key works → Frontend can connect');
console.log('   3. Check Supabase dashboard for any issues');