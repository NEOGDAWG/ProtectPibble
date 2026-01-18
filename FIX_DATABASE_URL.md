# Fix Empty DATABASE_URL Variable

I can see the issue: Your `DATABASE_URL` variable is **empty**! That's why the backend can't connect.

## The Problem

- ❌ `DATABASE_URL` = empty (this is wrong!)
- ✅ `DATABASE_PUBLIC_URL` = has the connection string
- ✅ `CORS_ORIGINS` = correct
- ✅ `ENV` = correct

## Solution

You have two options:

### Option 1: Use Railway Variable Reference (Recommended)

1. Click on the **`DATABASE_URL`** variable (or the three dots next to it)
2. Click **"Edit"** or **"Update"**
3. Set the value to: `${{ Postgres.DATABASE_URL }}`
4. Click **"Save"**

Railway will automatically replace this with the actual database connection string.

### Option 2: Use DATABASE_PUBLIC_URL Directly

If the variable reference doesn't work, you can use the public URL directly:

1. Click on **`DATABASE_URL`** variable
2. Click **"Edit"**
3. Copy the value from `DATABASE_PUBLIC_URL`:
   ```
   postgresql://postgres:LQvKoahivCVPEyS0sRXQWFCjxEinQlWy@nozomi.proxy.rlwy.net:26029/railway
   ```
4. Paste it into `DATABASE_URL`
5. **IMPORTANT**: Change `postgresql://` to `postgresql+psycopg://` (add `+psycopg`)
6. So it becomes:
   ```
   postgresql+psycopg://postgres:LQvKoahivCVPEyS0sRXQWFCjxEinQlWy@nozomi.proxy.rlwy.net:26029/railway
   ```
7. Click **"Save"**

## After Fixing

1. Railway will automatically redeploy your backend
2. Wait for deployment to finish
3. Check the deployment logs - should see backend starting successfully
4. Test: `https://your-backend.railway.app/health`
5. Should see: `{"ok":true}`

## Why This Happened

The `DATABASE_URL` variable was created but never given a value. Railway provides `DATABASE_PUBLIC_URL` automatically, but you need to either:
- Use the variable reference `${{ Postgres.DATABASE_URL }}` (best practice)
- Or copy the value manually (Option 2)

## Verify It's Fixed

After updating, your variables should be:
- ✅ `DATABASE_URL` = has a value (not empty)
- ✅ `ENV` = `production`
- ✅ `CORS_ORIGINS` = `https://protect-pibble.vercel.app`
