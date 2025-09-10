export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          wallet_address: string;
          username: string | null;
          email: string | null;
          created_at: string;
          updated_at: string;
          last_login: string | null;
          is_active: boolean;
          metadata: Record<string, any> | null;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          username?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          is_active?: boolean;
          metadata?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          username?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          is_active?: boolean;
          metadata?: Record<string, any> | null;
        };
      };
      reward_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: string;
          transaction_signature: string | null;
          status: 'pending' | 'confirmed' | 'failed';
          timestamp_earned: string;
          timestamp_claimed: string | null;
          created_at: string;
          updated_at: string;
          metadata: Record<string, any> | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: string;
          transaction_signature?: string | null;
          status?: 'pending' | 'confirmed' | 'failed';
          timestamp_earned?: string;
          timestamp_claimed?: string | null;
          created_at?: string;
          updated_at?: string;
          metadata?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: string;
          transaction_signature?: string | null;
          status?: 'pending' | 'confirmed' | 'failed';
          timestamp_earned?: string;
          timestamp_claimed?: string | null;
          created_at?: string;
          updated_at?: string;
          metadata?: Record<string, any> | null;
        };
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_token: string;
          expires_at: string;
          created_at: string;
          last_accessed: string;
          ip_address: string | null;
          user_agent: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_token: string;
          expires_at: string;
          created_at?: string;
          last_accessed?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_token?: string;
          expires_at?: string;
          created_at?: string;
          last_accessed?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          is_active?: boolean;
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