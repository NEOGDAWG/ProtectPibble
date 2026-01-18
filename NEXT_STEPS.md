# Next Steps - Your Database is Running! ✅

Your PostgreSQL database is up and running on Railway. Here's what to do next:

## ✅ Database Status: RUNNING
- Database is ready to accept connections
- Connection string: `postgresql://postgres:LQvKoahivCVPEySOsRXQWFCjxEinQlWy@nozomi.proxy.rlwy.net:26029/railway`

## Next Steps

### 1. Check Your Backend Service

1. In Railway, look for your **backend service** (the one running Python/FastAPI)
2. It should be a separate service from the PostgreSQL database
3. If you don't see it, you need to deploy it:
   - Click **"New"** → **"GitHub Repo"**
   - Select your `ProtectPibble` repository
   - Railway will auto-detect Python

### 2. Add Environment Variables to Backend

Click on your **backend service** → **Variables** tab → Add:

**DATABASE_URL:**
```
${{ Postgres.DATABASE_URL }}
```

**Note:** Use Railway's variable reference syntax. Railway will automatically connect to your PostgreSQL service.

**ENV:**
```
production
```

**CORS_ORIGINS:**
```
https://protect-pibble.vercel.app
```

### 3. Run Database Migrations

1. Wait for backend to deploy
2. Click on backend service → **Deployments** tab
3. Click **"..."** on latest deployment → **"Open Shell"**
4. Run:
   ```bash
   cd backend
   alembic upgrade head
   ```
5. Should see: `Running upgrade  -> 0001_create_mvp_tables`

### 4. Get Your Backend URL

1. Backend service → **Settings** → **Domains**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `https://xxx.railway.app`)

### 5. Update Frontend (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com)
2. Your project → **Settings** → **Environment Variables**
3. Add/Update `VITE_API_BASE_URL` = your Railway backend URL
4. **Redeploy** the frontend

### 6. Test Everything

1. Visit: https://protect-pibble.vercel.app/
2. Try logging in
3. Create a group
4. Should work! 🎉

## Troubleshooting

**If you don't see a backend service:**
- You need to deploy it from GitHub
- See Step 1 above

**If backend won't connect to database:**
- Make sure `DATABASE_URL` is set correctly in backend variables
- Check that backend service is in the same Railway project as database

**If migrations fail:**
- Make sure you're running `cd backend` first in the shell
- Check that `DATABASE_URL` is correct
