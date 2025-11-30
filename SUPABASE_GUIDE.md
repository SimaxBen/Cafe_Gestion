# Supabase Configuration Guide

## Quick Start with Supabase

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub (recommended) or email
4. Click "New project"
5. Fill in:
   - **Name**: `cafe-management` (or your choice)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Free tier is perfect for development
6. Click "Create new project"
7. Wait 2-3 minutes for database provisioning

### Step 2: Get Connection Details

1. In your Supabase dashboard, click on your project
2. Go to **Settings** (gear icon) → **Database**
3. Scroll to **Connection string** section
4. Copy the **URI** format (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your actual database password

### Step 3: Run Database Schema

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open the `database_schema.sql` file from the project
4. Copy ALL the contents
5. Paste into the Supabase SQL Editor
6. Click **"Run"** or press `Ctrl + Enter`
7. You should see "Success. No rows returned" (this is correct!)

### Step 4: Verify Tables Created

1. Go to **Table Editor** (left sidebar)
2. You should see all tables:
   - users
   - cafes
   - user_cafe_roles
   - staff
   - staff_salary_history
   - stock_items
   - stock_cost_history
   - menu_items
   - menu_price_history
   - menu_item_recipe
   - orders
   - order_items
   - monthly_expenses
   - daily_expenses
   - suppliers
   - purchase_orders
   - purchase_order_items

### Step 5: Configure Backend

1. Open `backend/.env` file (create it from `.env.example` if needed)
2. Update the `DATABASE_URL` with your Supabase connection string:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```

### Step 6: Optional - Get API Keys (for Storage/Realtime)

If you want to use Supabase storage for menu item images:

1. Go to **Settings** → **API**
2. Copy your:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJ...`
3. Add to `backend/.env`:
   ```env
   SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Supabase Features You Can Use

### 1. Built-in Storage (for menu images)

```python
from supabase import create_client, Client

supabase: Client = create_client(supabase_url, supabase_key)

# Upload image
with open("image.jpg", "rb") as f:
    supabase.storage.from_("menu-images").upload("item-123.jpg", f)

# Get public URL
url = supabase.storage.from_("menu-images").get_public_url("item-123.jpg")
```

### 2. Database Backups

- Go to **Settings** → **Database** → **Backups**
- Free tier: Daily backups for 7 days
- Paid tier: Point-in-time recovery

### 3. SQL Editor

- Write and save SQL queries
- Create functions and triggers
- View query execution plans

### 4. Table Editor

- Visual interface to view/edit data
- Add rows manually
- Export data as CSV

### 5. Authentication (Alternative to JWT)

Supabase has built-in auth, but we're using our custom JWT implementation for more control.

## Important Notes

### Security

1. **Never commit** your `.env` file to git
2. Your database password is sensitive - keep it secret
3. The `anon` key is safe for frontend use
4. Use `service_role` key only in backend (has admin privileges)

### Connection Pooling

Supabase uses PgBouncer for connection pooling:
- **Transaction mode** (port 6543): For transactions
- **Session mode** (port 5432): For long-lived connections (what we use)

### Rate Limits (Free Tier)

- Database: 500MB storage
- Bandwidth: 5GB/month
- API requests: Unlimited (with reasonable use)
- Concurrent connections: 60

### Database Extensions

Supabase has many PostgreSQL extensions enabled:
- `uuid-ossp` ✅ (we use this)
- `pgcrypto`
- `pg_stat_statements`
- And many more!

## Troubleshooting

### "Could not connect to database"

1. Check project status in dashboard (should be green/active)
2. Verify DATABASE_URL format is correct
3. Confirm password is correct (no typos)
4. Check if project is paused (free tier auto-pauses after 7 days of inactivity)

### "Relation does not exist"

- Schema wasn't run properly
- Re-run the `database_schema.sql` in SQL Editor
- Check for any error messages

### "Too many connections"

- Free tier has 60 concurrent connections
- Make sure you're closing database connections properly
- Consider using session pooling (port 6543)

### Schema Changes Not Reflecting

- Clear SQLAlchemy metadata cache
- Restart backend server
- Re-run migration SQL

## Monitoring

### View Logs

1. Go to **Logs** in Supabase dashboard
2. Filter by:
   - API logs
   - Database logs
   - Function logs

### Database Statistics

1. Go to **Reports**
2. View:
   - Query performance
   - Slow queries
   - Database size
   - Active connections

## Production Checklist

- [ ] Upgrade to paid tier for better limits
- [ ] Enable daily backups
- [ ] Set up custom domain
- [ ] Configure Row Level Security (RLS) policies
- [ ] Enable realtime if needed
- [ ] Monitor database size
- [ ] Set up alerts for errors

## Useful Supabase SQL Queries

### Check database size
```sql
SELECT pg_size_pretty(pg_database_size(current_database()));
```

### List all tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Count rows in all tables
```sql
SELECT schemaname, tablename, n_live_tup 
FROM pg_stat_user_tables 
ORDER BY n_live_tup DESC;
```

### View active connections
```sql
SELECT count(*) FROM pg_stat_activity;
```

## Support

- Documentation: https://supabase.com/docs
- Discord: https://discord.supabase.com
- GitHub: https://github.com/supabase/supabase

---

Ready to build! 🚀
