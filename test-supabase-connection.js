#!/usr/bin/env node

// Test Supabase connection
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔗 Testing Supabase connection...');
console.log(`📍 URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testTables() {
  try {
    console.log('\n🧪 Testing table access...');

    const tables = ['users', 'user_sessions', 'reward_transactions', 'reward_preferences', 'support_tickets'];

    let allTablesExist = true;
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error && error.code === 'PGRST116') {
        console.log(`❌ ${table}: table not found`);
        allTablesExist = false;
      } else if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        allTablesExist = false;
      } else {
        console.log(`✅ ${table}: accessible (${data || 0} rows)`);
      }
    }

    return allTablesExist;
  } catch (err) {
    console.error('❌ Error testing tables:', err.message);
    return false;
  }
}

async function main() {
  const tablesExist = await testTables();

  if (!tablesExist) {
    console.log('\n📋 To set up the database:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the SQL script from database-schema.sql');
    console.log('4. Or copy and paste the contents of database-schema.sql');
    console.log('5. Then run this test again');
    process.exit(1);
  } else {
    console.log('\n🎉 All database tables are set up correctly!');
    console.log('👉 You can now run: npm run dev');
  }
}

main().catch(console.error);