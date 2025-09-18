# Supabase Database Setup Guide

## Current Status
✅ Supabase connection credentials are configured
✅ Database connection test scripts are ready
⚠️ Database tables need to be created in Supabase dashboard

## Quick Setup Steps

### 1. Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project: `tytvjowgnhavnwwolkkt`
3. Click on "SQL Editor" in the left sidebar

### 2. Create Database Tables
1. In the SQL Editor, paste the contents of `database-schema.sql`
2. Click "RUN" to execute the schema
3. Verify tables are created by checking the "Table Editor"

### 3. Verify Setup
Run the test script to confirm everything is working:
```bash
node test-supabase-connection.js
```

Expected output:
```
🧪 Testing table access...
✅ users: accessible (0 rows)
✅ user_sessions: accessible (0 rows)
✅ reward_transactions: accessible (0 rows)
✅ reward_preferences: accessible (0 rows)
✅ support_tickets: accessible (0 rows)

🎉 All database tables are set up correctly!
```

### 4. Test API Health
After tables are created, test the API:
```bash
curl http://localhost:3001/api/v1/health | jq
```

Should return:
```json
{
  "data": {
    "status": "healthy",
    "services": {
      "database": "healthy",
      "solana": "healthy"
    }
  },
  "success": true
}
```

## Configuration Details

### Environment Variables
The following are already configured in `.env`:
- `SUPABASE_URL`: https://tytvjowgnhavnwwolkkt.supabase.co
- `SUPABASE_SERVICE_ROLE_KEY`: [configured]
- `SUPABASE_ANON_KEY`: [configured]

### Database Schema
The schema includes 5 main tables:
- `users` - Application users with wallet addresses
- `user_sessions` - Authentication sessions
- `reward_transactions` - Token rewards and claims
- `reward_preferences` - User reward settings
- `support_tickets` - Customer support

### Troubleshooting

**If you see "table not found" errors:**
1. Make sure you ran the SQL schema in the Supabase dashboard
2. Check that tables appear in the Table Editor
3. Verify the schema was created in the `public` schema (default)

**If connection fails:**
1. Verify the Supabase project URL and keys in `.env`
2. Check project settings in Supabase dashboard
3. Ensure project is not paused (free tier limitation)

## Next Steps After Setup
1. Run tests: `npm run test --workspace=@reward-system/api`
2. Start development: `npm run dev`
3. Test the API endpoints with proper database integration