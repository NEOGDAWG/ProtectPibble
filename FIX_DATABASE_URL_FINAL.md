# Fix DATABASE_URL - Final Step

The error shows your `DATABASE_URL` is still using placeholder values. Here's how to fix it:

## The Problem

Your `DATABASE_URL` in Render is:
```
postgresql+psycopg://user:pass@host/db
```

This is a placeholder! You need the **actual** database URL from your PostgreSQL service.

## Fix It Now

### Step 1: Get Real Database URL

1. In Render, click on your **PostgreSQL service** (the database, not backend)
2. Go to **Info** tab
3. Find **"Internal Database URL"**
4. Copy it - it looks like:
   ```
   postgresql://protectpibble:actualpassword@dpg-xxxxx-a.oregon-postgres.render.com:5432/protectpibble
   ```

### Step 2: Update Backend DATABASE_URL

1. In Render, click on your **backend service** (not the database)
2. Go to **Settings** → **Environment Variables**
3. Find `DATABASE_URL`
4. Click **"Edit"**
5. **Delete the placeholder value** (`postgresql+psycopg://user:pass@host/db`)
6. Paste the **Internal Database URL** from Step 1
7. **IMPORTANT**: Change `postgresql://` to `postgresql+psycopg://` at the beginning
8. So if Internal URL is:
   ```
   postgresql://protectpibble:password@dpg-xxxxx.render.com:5432/protectpibble
   ```
9. Set `DATABASE_URL` to:
   ```
   postgresql+psycopg://protectpibble:password@dpg-xxxxx.render.com:5432/protectpibble
   ```
10. Click **"Save"**

### Step 3: Wait for Redeploy

Render will automatically redeploy. Wait 1-2 minutes.

### Step 4: Check Logs

After redeploy, check logs. You should see:
- ✅ No "falling back to SQLite" message
- ✅ Backend starting successfully
- ✅ Migrations running automatically

## Also Fixed

I've also added the missing `email-validator` package to requirements.txt. Render will install it on the next deploy.

## Summary

1. Get Internal Database URL from PostgreSQL service
2. Change `postgresql://` to `postgresql+psycopg://`
3. Update `DATABASE_URL` in backend service
4. Save and wait for redeploy

That's it! Once the real database URL is set, everything should work.
