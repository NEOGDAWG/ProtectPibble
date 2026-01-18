# Fix Render Database Connection

Your backend deployed but it's using SQLite instead of PostgreSQL. Here's how to fix it:

## The Problem

The logs show:
```
[protectpibble] DATABASE_URL unreachable; falling back to local SQLite
```

This means the `DATABASE_URL` environment variable is either:
1. Not set correctly
2. Using wrong format (needs `postgresql+psycopg://` not `postgresql://`)

## Fix Step 1: Update DATABASE_URL Format

1. In Render, go to your **backend service**
2. **Settings** → **Environment Variables**
3. Find `DATABASE_URL`
4. Click **"Edit"**
5. Make sure it starts with `postgresql+psycopg://` (not `postgresql://`)
6. If it's `postgresql://`, change it to `postgresql+psycopg://`
7. Click **"Save"**
8. Render will automatically redeploy

## Fix Step 2: Run Migrations (Since Shell is Premium)

Since Render Shell is premium-only, you have two options:

### Option A: Run Migrations from Your Local Machine (Easiest)

1. Get your Render database URL:
   - In Render, go to your PostgreSQL service
   - **Info** tab → Copy the **Internal Database URL**
   - Change `postgresql://` to `postgresql+psycopg://`

2. On your local machine, run:
   ```bash
   cd /Users/ks/Desktop/PROJECTS/ProtectPibble/backend
   source .venv/bin/activate
   export DATABASE_URL="postgresql+psycopg://your-render-database-url"
   alembic upgrade head
   ```

3. Migrations will run against your Render database!

### Option B: Auto-Run Migrations on Startup (Better for Production)

I can modify the code to automatically run migrations when the backend starts. This way you don't need Shell access.

## After Fixing DATABASE_URL

1. Wait for Render to redeploy
2. Check logs - should NOT see "falling back to local SQLite"
3. Should see backend connecting to PostgreSQL
4. Test: `https://protectpibble.onrender.com/health`
5. Should still work: `{"ok":true}`

## Then Update Vercel

Once database is connected and migrations are run:

1. Go to Vercel → Your project → **Settings** → **Environment Variables**
2. Update `VITE_API_BASE_URL` = `https://protectpibble.onrender.com`
3. **Redeploy** frontend
4. Test: https://protect-pibble.vercel.app/

## Quick Checklist

- [ ] Fix `DATABASE_URL` format (use `postgresql+psycopg://`)
- [ ] Run migrations (from local machine)
- [ ] Verify backend connects to database (check logs)
- [ ] Update Vercel `VITE_API_BASE_URL`
- [ ] Test the app!
