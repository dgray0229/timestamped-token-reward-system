#!/usr/bin/env node

// Debug database health check
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkDatabaseHealth() {
  try {
    console.log('Testing database health check...');
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    console.log('Data:', data);
    console.log('Error:', error);

    return !error;
  } catch (err) {
    console.log('Exception:', err);
    return false;
  }
}

checkDatabaseHealth().then(result => {
  console.log('Health check result:', result);
});