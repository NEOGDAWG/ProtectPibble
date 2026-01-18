# Deploy Backend to Render (Simpler Alternative)

Since Railway is giving you trouble, let's use **Render** instead - it's often simpler for Python apps!

## Why Render?

- ✅ Easier setup than Railway
- ✅ Better Python support
- ✅ Can provide PostgreSQL database
- ✅ Free tier available
- ✅ Simpler configuration

## Step 1: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub (free)
3. Authorize Render

## Step 2: Create PostgreSQL Database

1. In Render dashboard, click **"New +"** → **"PostgreSQL"**
2. Fill in:
   - **Name**: `protectpibble-db` (or any name)
   - **Database**: `protectpibble`
   - **User**: `protectpibble` (or auto-generated)
   - **Region**: Choose closest to you
   - **PostgreSQL Version**: 16 (or latest)
   - **Plan**: Free (for testing)
3. Click **"Create Database"**
4. Wait 2-3 minutes for database to provision
5. Copy the **"Internal Database URL"** - you'll need this!

## Step 3: Deploy Backend

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository (`ProtectPibble`)
3. Configure:
   - **Name**: `protectpibble-backend`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend` (IMPORTANT!)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Click **"Advanced"** and add environment variables:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste the Internal Database URL from Step 2
   - Click **"Add"**
   
   - **Key**: `ENV`
   - **Value**: `production`
   - Click **"Add"**
   
   - **Key**: `CORS_ORIGINS`
   - **Value**: `https://protect-pibble.vercel.app`
   - Click **"Add"**
5. Click **"Create Web Service"**
6. Wait for deployment (3-5 minutes)

## Step 4: Run Database Migrations

1. Once backend is deployed, go to **"Shell"** tab
2. Click **"Open Shell"**
3. Run:
   ```bash
   alembic upgrade head
   ```
4. Should see: `Running upgrade  -> 0001_create_mvp_tables`

## Step 5: Get Your Backend URL

1. In your backend service, you'll see a URL like: `https://protectpibble-backend.onrender.com`
2. **Copy this URL** - you'll need it for Vercel!

## Step 6: Update Vercel Frontend

1. Go to Vercel dashboard
2. Your project → **Settings** → **Environment Variables**
3. Update `VITE_API_BASE_URL`:
   - **Value**: Your Render backend URL (from Step 5)
   - Example: `https://protectpibble-backend.onrender.com`
4. **Redeploy** the frontend

## Step 7: Test Everything

1. Visit: https://protect-pibble.vercel.app/
2. Try logging in
3. Create a group
4. Should work! 🎉

## Your URLs

- **Frontend**: https://protect-pibble.vercel.app/ (Vercel)
- **Backend**: `https://xxx.onrender.com` (Render)
- **Database**: Managed by Render (internal)

## Troubleshooting

**Backend won't start?**
- Check Render logs (Logs tab)
- Verify `DATABASE_URL` is correct
- Make sure Root Directory is set to `backend`

**Database connection errors?**
- Use the **Internal Database URL** (not External)
- Make sure backend and database are in same region

**CORS errors?**
- Verify `CORS_ORIGINS` matches your Vercel URL exactly
- No trailing slash

## Cost

- **Render Free Tier**: 
  - Web services: Free (spins down after 15 min inactivity)
  - PostgreSQL: Free (90 days, then $7/month)
  - Perfect for testing/class projects!

## Alternative: Keep Database on Railway

If you want to keep your Railway database:

1. In Render backend, use Railway's database URL:
   - Get it from Railway → Postgres → Variables → `DATABASE_PUBLIC_URL`
   - Change `postgresql://` to `postgresql+psycopg://`
   - Use that as `DATABASE_URL` in Render

This way you use:
- Vercel for frontend ✅
- Render for backend ✅  
- Railway for database ✅
