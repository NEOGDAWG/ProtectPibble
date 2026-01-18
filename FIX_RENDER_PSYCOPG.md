# Fix Render psycopg2 Error

The error shows SQLAlchemy is trying to use `psycopg2` but you have `psycopg` (version 3) installed.

## The Problem

The database URL from Render uses `postgresql://` which makes SQLAlchemy try to use `psycopg2`. But you have `psycopg` (v3) installed.

## Solution: Update DATABASE_URL Format

In Render, update your `DATABASE_URL` environment variable:

1. Go to your backend service in Render
2. **Settings** → **Environment Variables**
3. Find `DATABASE_URL`
4. Click **"Edit"**
5. Change the URL from:
   ```
   postgresql://user:pass@host/db
   ```
   To:
   ```
   postgresql+psycopg://user:pass@host/db
   ```
   
   **Important:** Add `+psycopg` after `postgresql`!

6. Click **"Save"**
7. Render will automatically redeploy

## Example

**Before:**
```
postgresql://protectpibble:password@dpg-xxxxx.render.com/protectpibble
```

**After:**
```
postgresql+psycopg://protectpibble:password@dpg-xxxxx.render.com/protectpibble
```

## Why This Works

- `postgresql://` → SQLAlchemy tries to use psycopg2 (old version)
- `postgresql+psycopg://` → SQLAlchemy uses psycopg (version 3, which you have installed)

## After Fixing

1. Wait for Render to redeploy
2. Check the logs - should see backend starting successfully
3. Test: `https://your-backend.onrender.com/health`
4. Should see: `{"ok":true}`

Then you can run migrations!
