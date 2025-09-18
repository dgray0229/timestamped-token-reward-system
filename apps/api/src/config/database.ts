import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://demo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'demo-key';

if (process.env.NODE_ENV === 'production' && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
  throw new Error('Missing Supabase configuration in production environment');
}

// Log configuration status
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Development mode: Using mock Supabase configuration');
  console.log('   To use real Supabase, update SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    // Test basic connection by trying to access users table
    const { error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error && error.code === 'PGRST116') {
      console.log('⚠️  Database connected but tables not found');
      console.log('   Run the database-schema.sql file in your Supabase SQL editor');
      console.log('   Or use: node test-supabase-connection.js');
      return false; // Connection works but no tables
    }

    if (error) {
      console.error('❌ Database connection test failed:', error);
      return false;
    }

    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection test error:', error);
    return false;
  }
}