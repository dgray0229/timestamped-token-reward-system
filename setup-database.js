#!/usr/bin/env node

// Direct database setup script using Supabase client
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log('🚀 Setting up database tables...');

// Individual table creation commands
const tables = [
  {
    name: 'users',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_address TEXT UNIQUE NOT NULL,
        username TEXT,
        email TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        last_login TIMESTAMPTZ,
        is_active BOOLEAN DEFAULT true,
        metadata JSONB
      );
      CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
    `
  },
  {
    name: 'user_sessions',
    sql: `
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        session_token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_accessed TIMESTAMPTZ DEFAULT NOW(),
        ip_address TEXT,
        user_agent TEXT,
        is_active BOOLEAN DEFAULT true
      );
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
    `
  },
  {
    name: 'reward_transactions',
    sql: `
      CREATE TABLE IF NOT EXISTS reward_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(20, 8) NOT NULL,
        transaction_signature TEXT,
        status TEXT CHECK (status IN ('pending', 'confirmed', 'failed')) DEFAULT 'pending',
        timestamp_earned TIMESTAMPTZ NOT NULL,
        timestamp_claimed TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        metadata JSONB
      );
      CREATE INDEX IF NOT EXISTS idx_reward_transactions_user_id ON reward_transactions(user_id);
    `
  },
  {
    name: 'reward_preferences',
    sql: `
      CREATE TABLE IF NOT EXISTS reward_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        auto_claim_enabled BOOLEAN DEFAULT false,
        min_claim_amount DECIMAL(20, 8) DEFAULT '0.01',
        email_notifications BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  },
  {
    name: 'support_tickets',
    sql: `
      CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        transaction_id UUID REFERENCES reward_transactions(id) ON DELETE SET NULL,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
        priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        resolved_at TIMESTAMPTZ,
        metadata JSONB
      );
    `
  }
];

async function createTables() {
  for (const table of tables) {
    try {
      console.log(`Creating table: ${table.name}...`);

      // Use rpc to execute raw SQL
      const { error } = await supabase.rpc('exec_sql', { sql_query: table.sql });

      if (error) {
        console.error(`❌ Failed to create ${table.name}:`, error);
        return false;
      }

      console.log(`✅ ${table.name} created successfully`);
    } catch (err) {
      console.error(`❌ Error creating ${table.name}:`, err.message);
      return false;
    }
  }
  return true;
}

async function testTables() {
  console.log('\n🧪 Testing table access...');

  const tableNames = ['users', 'user_sessions', 'reward_transactions', 'reward_preferences', 'support_tickets'];

  for (const tableName of tableNames) {
    try {
      const { data, error } = await supabase.from(tableName).select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
        return false;
      } else {
        console.log(`✅ ${tableName}: accessible (${data || 0} rows)`);
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ${err.message}`);
      return false;
    }
  }
  return true;
}

async function main() {
  try {
    // First test if tables already exist
    const tablesExist = await testTables();

    if (tablesExist) {
      console.log('\n🎉 All tables already exist and are working!');
      return;
    }

    console.log('\n📋 Tables need to be created manually in Supabase dashboard:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the contents of database-schema.sql');
    console.log('4. Then run this script again to verify');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

main();