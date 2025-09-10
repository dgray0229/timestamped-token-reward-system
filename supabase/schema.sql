-- Timestamped Token Reward System Database Schema
-- This schema defines the database structure for the reward system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table - stores user account information
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_address VARCHAR(44) NOT NULL UNIQUE,
    username VARCHAR(30) UNIQUE,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for users table
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_created_at ON users(created_at);

-- Reward transactions table - stores all reward transactions
CREATE TABLE reward_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(18, 6) NOT NULL CHECK (amount > 0),
    transaction_signature VARCHAR(128),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    timestamp_earned TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    timestamp_claimed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for reward_transactions table
CREATE INDEX idx_reward_transactions_user_id ON reward_transactions(user_id);
CREATE INDEX idx_reward_transactions_status ON reward_transactions(status);
CREATE INDEX idx_reward_transactions_timestamp_earned ON reward_transactions(timestamp_earned);
CREATE INDEX idx_reward_transactions_timestamp_claimed ON reward_transactions(timestamp_claimed);
CREATE INDEX idx_reward_transactions_signature ON reward_transactions(transaction_signature) WHERE transaction_signature IS NOT NULL;

-- User sessions table - stores active user sessions
CREATE TABLE user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Add indexes for user_sessions table
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = true;

-- Reward preferences table - stores user reward preferences
CREATE TABLE reward_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    auto_claim_enabled BOOLEAN DEFAULT false,
    min_claim_amount DECIMAL(18, 6) DEFAULT 0.1,
    email_notifications BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for reward_preferences table
CREATE INDEX idx_reward_preferences_user_id ON reward_preferences(user_id);

-- Support tickets table - stores user support requests
CREATE TABLE support_tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES reward_transactions(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for support_tickets table
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_transaction_id ON support_tickets(transaction_id) WHERE transaction_id IS NOT NULL;
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at);

-- Create triggers to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_reward_transactions_updated_at BEFORE UPDATE ON reward_transactions
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_reward_preferences_updated_at BEFORE UPDATE ON reward_preferences
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create a function to get user reward statistics
CREATE OR REPLACE FUNCTION get_user_reward_stats(user_uuid UUID)
RETURNS TABLE (
    total_earned DECIMAL,
    total_claims INTEGER,
    success_rate DECIMAL,
    average_claim_amount DECIMAL,
    first_claim_date TIMESTAMP WITH TIME ZONE,
    last_claim_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(amount), 0) as total_earned,
        COUNT(*)::INTEGER as total_claims,
        CASE 
            WHEN COUNT(*) = 0 THEN 0 
            ELSE (COUNT(*) FILTER (WHERE status = 'confirmed')::DECIMAL / COUNT(*)::DECIMAL) * 100
        END as success_rate,
        CASE 
            WHEN COUNT(*) FILTER (WHERE status = 'confirmed') = 0 THEN 0
            ELSE AVG(amount) FILTER (WHERE status = 'confirmed')
        END as average_claim_amount,
        MIN(timestamp_claimed) FILTER (WHERE status = 'confirmed') as first_claim_date,
        MAX(timestamp_claimed) FILTER (WHERE status = 'confirmed') as last_claim_date
    FROM reward_transactions 
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create a function to calculate available rewards for a user
CREATE OR REPLACE FUNCTION calculate_available_rewards(
    user_uuid UUID,
    reward_rate_per_hour DECIMAL DEFAULT 0.1,
    min_claim_interval_hours INTEGER DEFAULT 24,
    max_daily_reward DECIMAL DEFAULT 2.4
)
RETURNS TABLE (
    available_amount DECIMAL,
    hours_since_last_claim INTEGER,
    next_claim_available_in INTEGER,
    can_claim BOOLEAN
) AS $$
DECLARE
    last_claim_time TIMESTAMP WITH TIME ZONE;
    user_created_at TIMESTAMP WITH TIME ZONE;
    hours_diff INTEGER;
    calculated_reward DECIMAL;
BEGIN
    -- Get user creation time
    SELECT created_at INTO user_created_at FROM users WHERE id = user_uuid;
    
    -- Get last successful claim time
    SELECT MAX(timestamp_claimed) 
    INTO last_claim_time
    FROM reward_transactions 
    WHERE user_id = user_uuid AND status = 'confirmed';
    
    -- Use registration time if no claims yet
    IF last_claim_time IS NULL THEN
        last_claim_time := user_created_at;
    END IF;
    
    -- Calculate hours since last claim
    hours_diff := EXTRACT(EPOCH FROM (NOW() - last_claim_time)) / 3600;
    
    -- Calculate available reward
    IF hours_diff >= min_claim_interval_hours THEN
        calculated_reward := LEAST(
            LEAST(hours_diff, 24) * reward_rate_per_hour,
            max_daily_reward
        );
    ELSE
        calculated_reward := 0;
    END IF;
    
    RETURN QUERY SELECT 
        calculated_reward,
        hours_diff,
        GREATEST(0, min_claim_interval_hours - hours_diff),
        (hours_diff >= min_claim_interval_hours);
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance on common queries
CREATE INDEX idx_reward_transactions_user_status_time ON reward_transactions(user_id, status, timestamp_claimed);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- Create a view for active user sessions
CREATE VIEW active_user_sessions AS
SELECT 
    s.*,
    u.wallet_address,
    u.username
FROM user_sessions s
JOIN users u ON s.user_id = u.id
WHERE s.is_active = true 
  AND s.expires_at > NOW();

-- Create a view for user transaction summaries
CREATE VIEW user_transaction_summary AS
SELECT 
    u.id as user_id,
    u.wallet_address,
    u.username,
    COUNT(rt.id) as total_transactions,
    COUNT(rt.id) FILTER (WHERE rt.status = 'confirmed') as confirmed_transactions,
    COUNT(rt.id) FILTER (WHERE rt.status = 'pending') as pending_transactions,
    COUNT(rt.id) FILTER (WHERE rt.status = 'failed') as failed_transactions,
    COALESCE(SUM(rt.amount) FILTER (WHERE rt.status = 'confirmed'), 0) as total_earned,
    MAX(rt.timestamp_claimed) FILTER (WHERE rt.status = 'confirmed') as last_claim_date
FROM users u
LEFT JOIN reward_transactions rt ON u.id = rt.user_id
GROUP BY u.id, u.wallet_address, u.username;

-- Insert some sample configuration data if needed (commented out for production)
-- This would typically be handled by environment variables in the application

-- Grant appropriate permissions (adjust based on your Supabase setup)
-- These would typically be handled by Supabase's built-in authentication and RLS

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic examples - adjust based on your authentication setup)
-- Note: These are basic policies and should be customized based on your authentication requirements

CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view their own transactions" ON reward_transactions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own preferences" ON reward_preferences
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own preferences" ON reward_preferences
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own tickets" ON support_tickets
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own tickets" ON support_tickets
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);