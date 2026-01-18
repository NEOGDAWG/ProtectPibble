# Verify All Connections - Step by Step

Let's check if everything is connected properly.

## Step 1: Check Backend Service Exists

In Railway dashboard:
1. Do you see **TWO services**?
   - One called "Postgres" (database) ✅
   - One for your backend (Python/FastAPI) ❓

**If you DON'T see a backend service:**
- You need to deploy it first!
- Click "New" → "GitHub Repo"
- Select your ProtectPibble repository
- Railway will auto-detect Python

## Step 2: Check Backend Variables

Click on your **backend service** (not Postgres):
1. Go to **Variables** tab
2. Verify you have:
   - `DATABASE_URL` = `${{ Postgres.DATABASE_URL }}` (or the actual connection string)
   - `ENV` = `production`
   - `CORS_ORIGINS` = `https://protect-pibble.vercel.app`

**If DATABASE_URL is empty:**
- Click "Edit" on DATABASE_URL
- Set to: `${{ Postgres.DATABASE_URL }}`
- Or copy from DATABASE_PUBLIC_URL and change `postgresql://` to `postgresql+psycopg://`

## Step 3: Check Backend is Running

1. Click on backend service → **Settings** tab
2. Scroll to **"Domains"**
3. Do you see a domain? (e.g., `https://xxx.railway.app`)
   - If not, click "Generate Domain"
4. Copy the URL
5. Test it: Open `https://your-backend.railway.app/health` in browser
   - Should see: `{"ok":true}`
   - If you see an error, backend isn't running properly

## Step 4: Check Frontend Connection

1. Go to Vercel dashboard
2. Your project → **Settings** → **Environment Variables**
3. Check `VITE_API_BASE_URL`:
   - Should be your Railway backend URL (from Step 3)
   - Example: `https://xxx.railway.app`
4. If it's wrong or missing, update it and redeploy

## Step 5: Test Everything

1. Visit: https://protect-pibble.vercel.app/
2. Open browser console (F12)
3. Try to log in
4. Check for errors:
   - **CORS error** = Backend CORS_ORIGINS is wrong
   - **Failed to fetch** = Frontend can't reach backend (check VITE_API_BASE_URL)
   - **500 error** = Backend has a problem (check Railway logs)

## Quick Test Commands

**Test backend directly:**
```bash
curl https://your-backend.railway.app/health
```
Should return: `{"ok":true}`

**Test from frontend:**
Open browser console on https://protect-pibble.vercel.app/
Look for API calls and any errors

## Common Issues

**"Backend service doesn't exist"**
→ Deploy it from GitHub repo

**"DATABASE_URL is empty"**
→ Set it to `${{ Postgres.DATABASE_URL }}`

**"Backend /health returns error"**
→ Check Railway deployment logs

**"Frontend can't reach backend"**
→ Check VITE_API_BASE_URL in Vercel

**"CORS errors"**
→ Check CORS_ORIGINS in Railway backend
