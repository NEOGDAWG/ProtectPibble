# Railway Setup - Quick Guide

You already have your database URL! Here's what to do next:

## Your Database URL
```
postgresql://postgres:LQvKoahivCVPEySOsRXQWFCjxEinQlWy@nozomi.proxy.rlwy.net:26029/railway
```

## Next Steps

### 1. Deploy Backend Service

1. In your Railway project, click **"New"** → **"GitHub Repo"**
2. Select your `ProtectPibble` repository
3. Railway will auto-detect it's Python and create a service

### 2. Configure Environment Variables

1. Click on your **backend service** (not the database)
2. Go to **Variables** tab
3. Click **"New Variable"** and add these:

   **Variable 1:**
   - Name: `DATABASE_URL`
   - Value: `${{ Postgres.DATABASE_URL }}`
   - Click "Add"
   
   **Note:** Railway will automatically replace `${{ Postgres.DATABASE_URL }}` with the actual database connection string from your PostgreSQL service.

   **Variable 2:**
   - Name: `ENV`
   - Value: `production`
   - Click "Add"

   **Variable 3:**
   - Name: `CORS_ORIGINS`
   - Value: `https://your-app.vercel.app` (we'll update this after frontend deploys)
   - Click "Add"

4. Railway will automatically redeploy

### 3. Run Database Migrations

1. Wait for deployment to finish
2. Click on your backend service
3. Go to **Deployments** tab
4. Click the **"..."** menu on the latest deployment
5. Click **"Open Shell"**
6. In the shell, run:
   ```bash
   cd backend
   alembic upgrade head
   ```
7. You should see: `INFO  [alembic.runtime.migration] Running upgrade  -> 0001_create_mvp_tables`

### 4. Get Your Backend URL

1. Click **Settings** tab
2. Scroll to **"Domains"**
3. Click **"Generate Domain"**
4. Copy the URL (e.g., `https://protectpibble-production.up.railway.app`)
5. **Save this URL** - you'll need it for Vercel!

### 5. Test Backend

1. Open your Railway URL + `/health` (e.g., `https://xxx.railway.app/health`)
2. Should see: `{"ok":true}`
3. Try `/docs` to see API documentation

✅ **Backend is ready!**

## Next: Deploy Frontend

Now go to **Step 3** in `DEPLOY_NOW.md` to deploy the frontend to Vercel!
