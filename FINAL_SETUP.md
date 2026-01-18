# Final Setup - Connect Frontend & Backend

Your frontend is live at: **https://protect-pibble.vercel.app/**

Now let's connect it to your backend!

## Step 1: Update Backend CORS

1. Go to [Railway Dashboard](https://railway.app)
2. Click on your **backend service** (not the database)
3. Go to **Variables** tab
4. Find the `CORS_ORIGINS` variable
5. Click **"Edit"** or **"Update"**
6. Set the value to:
   ```
   https://protect-pibble.vercel.app
   ```
7. Save - Railway will automatically redeploy

## Step 2: Update Frontend API URL

1. Go to [Vercel Dashboard](https://vercel.com)
2. Click on your `protectpibble` project
3. Go to **Settings** → **Environment Variables**
4. Find or add `VITE_API_BASE_URL`
5. Set it to your **Railway backend URL** (e.g., `https://xxx.railway.app`)
6. Make sure it's enabled for **Production, Preview, and Development**
7. Go to **Deployments** tab
8. Click **"..."** on latest deployment → **"Redeploy"**

## Step 3: Test Everything

1. Visit: https://protect-pibble.vercel.app/
2. Try logging in with:
   - Email: `test@example.com`
   - Name: `Test User`
3. Create a group
4. Create a task
5. Everything should work! 🎉

## Troubleshooting

**If you see CORS errors:**
- Make sure `CORS_ORIGINS` in Railway exactly matches: `https://protect-pibble.vercel.app`
- No trailing slash!
- Wait for Railway to redeploy (30 seconds)

**If frontend can't reach backend:**
- Check `VITE_API_BASE_URL` in Vercel matches your Railway URL
- Make sure backend is running (check Railway dashboard)
- Try visiting your Railway URL + `/health` to verify it's up

**If database errors:**
- Make sure migrations ran: In Railway shell, run `cd backend && alembic upgrade head`
- Verify `DATABASE_URL` is set correctly in Railway

## Your URLs

- **Frontend**: https://protect-pibble.vercel.app/
- **Backend**: `https://xxx.railway.app` (your Railway URL)
- **API Docs**: `https://xxx.railway.app/docs`

## Share with Others!

1. Visit your app: https://protect-pibble.vercel.app/
2. Create a group
3. Copy the invite code
4. Share the app URL + invite code with classmates!
