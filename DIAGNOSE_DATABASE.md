# Diagnose Database Connection Issue

Let's figure out what's actually wrong. The backend keeps saying "DATABASE_URL unreachable".

## Step 1: Check What DATABASE_URL Actually Is

In Render:
1. Go to your **backend service**
2. **Settings** → **Environment Variables**
3. Find `DATABASE_URL`
4. **What does it say?** Write it down (you can hide the password part)

Common issues:
- Is it empty?
- Does it start with `postgresql://` (wrong - needs `postgresql+psycopg://`)?
- Is it the Internal Database URL from your PostgreSQL service?

## Step 2: Check Your PostgreSQL Service

1. In Render, go to your **PostgreSQL service**
2. **Info** tab
3. Copy the **Internal Database URL**
4. Does it match what's in your backend's `DATABASE_URL`?

## Step 3: Verify Format

The Internal Database URL from Render looks like:
```
postgresql://user:password@host:port/dbname
```

But your backend needs:
```
postgresql+psycopg://user:password@host:port/dbname
```

**The difference:** `postgresql://` → `postgresql+psycopg://`

## Step 4: Simple Fix

1. In Render, go to PostgreSQL service → **Info** tab
2. Copy the **Internal Database URL**
3. Change `postgresql://` to `postgresql+psycopg://`
4. Go to backend service → **Settings** → **Environment Variables**
5. Update `DATABASE_URL` with the modified URL
6. Save and wait for redeploy

## Step 5: Check Logs After Redeploy

After redeploy, check the logs. You should NOT see:
- ❌ "DATABASE_URL unreachable; falling back to local SQLite"

You SHOULD see:
- ✅ Backend starting normally
- ✅ Migrations running (if auto-migration works)
- ✅ No SQLite fallback message

## If Still Not Working

Tell me:
1. What does your `DATABASE_URL` value look like? (hide password)
2. Does it start with `postgresql+psycopg://`?
3. Are backend and database in the same Render project?
4. What region are they in? (should be the same)

Let's figure this out step by step!
