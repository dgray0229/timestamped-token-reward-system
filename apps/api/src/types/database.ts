export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          wallet_address: string;
          username: string;
          email: string | null;
          total_rewards_earned: string;
          last_claim_timestamp: string;
          created_at: string;
          updated_at: string;
          last_login: string | null;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          username?: string;
          email?: string | null;
          total_rewards_earned?: string;
          last_claim_timestamp?: string;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          username?: string;
          email?: string | null;
          total_rewards_earned?: string;
          last_claim_timestamp?: string;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
        };
      };
      reward_transactions: {
        Row: {
          id: string;
          user_id: string;
          reward_amount: string;
          transaction_signature: string;
          status: 'pending' | 'confirmed' | 'failed';
          timestamp_earned: string;
          timestamp_claimed: string;
          block_number: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          reward_amount: string;
          transaction_signature?: string;
          status?: 'pending' | 'confirmed' | 'failed';
          timestamp_earned?: string;
          timestamp_claimed?: string;
          block_number?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          reward_amount?: string;
          transaction_signature?: string;
          status?: 'pending' | 'confirmed' | 'failed';
          timestamp_earned?: string;
          timestamp_claimed?: string;
          block_number?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          wallet_address: string;
          session_token: string;
          expires_at: string;
          is_active: boolean;
          last_activity: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          wallet_address: string;
          session_token: string;
          expires_at: string;
          is_active?: boolean;
          last_activity?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          wallet_address?: string;
          session_token?: string;
          expires_at?: string;
          is_active?: boolean;
          last_activity?: string;
        };
      };
      reward_preferences: {
        Row: {
          id: string;
          user_id: string;
          auto_claim_enabled: boolean;
          min_claim_amount: string;
          email_notifications: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          auto_claim_enabled?: boolean;
          min_claim_amount?: string;
          email_notifications?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          auto_claim_enabled?: boolean;
          min_claim_amount?: string;
          email_notifications?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      support_tickets: {
        Row: {
          id: string;
          user_id: string;
          transaction_id: string | null;
          type: string;
          description: string;
          status: 'open' | 'in_progress' | 'resolved' | 'closed';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
          metadata: Record<string, any> | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          transaction_id?: string | null;
          type: string;
          description: string;
          status?: 'open' | 'in_progress' | 'resolved' | 'closed';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
          metadata?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          transaction_id?: string | null;
          type?: string;
          description?: string;
          status?: 'open' | 'in_progress' | 'resolved' | 'closed';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
          metadata?: Record<string, any> | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}