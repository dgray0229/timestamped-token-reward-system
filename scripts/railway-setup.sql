-- Railway Database Setup for Reward System
-- This script sets up the database structure for Railway PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(44) UNIQUE NOT NULL,
    username VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Create reward_stats table
CREATE TABLE IF NOT EXISTS reward_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_earned DECIMAL(18, 9) DEFAULT 0,
    total_claimed DECIMAL(18, 9) DEFAULT 0,
    claim_count INTEGER DEFAULT 0,
    last_claim_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(18, 9) NOT NULL,
    transaction_signature VARCHAR(88),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    timestamp_earned TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    timestamp_claimed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_reward_stats_user_id ON reward_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp_earned);

-- Create trigger to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reward_stats_updated_at ON reward_stats;
CREATE TRIGGER update_reward_stats_updated_at
    BEFORE UPDATE ON reward_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create reward configuration table
CREATE TABLE IF NOT EXISTS reward_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reward_rate_per_hour DECIMAL(18, 9) DEFAULT 1.0,
    min_claim_amount DECIMAL(18, 9) DEFAULT 0.1,
    max_claim_amount DECIMAL(18, 9) DEFAULT 1000.0,
    claim_cooldown_hours INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default configuration if not exists
INSERT INTO reward_config (reward_rate_per_hour, min_claim_amount, max_claim_amount, claim_cooldown_hours)
SELECT 1.0, 0.1, 1000.0, 1
WHERE NOT EXISTS (SELECT 1 FROM reward_config WHERE is_active = true);

-- Create function to initialize user reward stats
CREATE OR REPLACE FUNCTION initialize_user_reward_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO reward_stats (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically create reward stats for new users
DROP TRIGGER IF EXISTS create_reward_stats_for_user ON users;
CREATE TRIGGER create_reward_stats_for_user
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_reward_stats();

-- Add helpful comments
COMMENT ON TABLE users IS 'User accounts linked to Solana wallet addresses';
COMMENT ON TABLE user_sessions IS 'User authentication sessions';
COMMENT ON TABLE reward_stats IS 'Aggregated reward statistics per user';
COMMENT ON TABLE transactions IS 'Individual reward transactions';
COMMENT ON TABLE reward_config IS 'System-wide reward configuration';

COMMENT ON COLUMN users.wallet_address IS 'Solana wallet public key (base58 encoded)';
COMMENT ON COLUMN transactions.transaction_signature IS 'Solana transaction signature';
COMMENT ON COLUMN transactions.amount IS 'Reward amount in SOL (lamports / 10^9)';