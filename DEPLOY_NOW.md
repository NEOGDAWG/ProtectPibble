# 🚀 Deploy ProtectPibble - Step by Step

Follow these steps in order. I'll guide you through everything.

## ⚠️ What You Need

- A GitHub account (free)
- 10-15 minutes
- A web browser

**We only need 2 services:**
- **Vercel** - For the frontend (React app)
- **Railway** - For the backend AND database (PostgreSQL)

That's it! Much simpler than using 3 separate services.

## Step 1: Push Code to GitHub (5 min)

### 1.1 Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `protectpibble` (or any name you like)
3. Make it **Public** (required for free tiers)
4. **Don't** check "Initialize with README"
5. Click "Create repository"

### 1.2 Push Your Code

Open Terminal in your project folder and run:

```bash
cd /Users/ks/Desktop/PROJECTS/ProtectPibble

# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - ready for deployment"

# Add your GitHub repo (replace YOUR_USERNAME and YOUR_REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repo name!**

---

## Step 2: Deploy Backend to Railway (5 min)

Railway will host both your backend AND provide the database. Much simpler!

### 2.1 Create Railway Account

1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign in with GitHub
4. Authorize Railway to access your repositories

### 2.2 Create Database First

1. Click "New Project"
2. Click "Provision PostgreSQL" (this creates the database)
3. Wait 30 seconds for it to provision
4. Click on the PostgreSQL service
5. Go to **Variables** tab
6. Find `DATABASE_URL` - this is your connection string!
7. **Copy this value** - you'll need it in a moment

### 2.3 Deploy Backend

1. In the same Railway project, click "New" → "GitHub Repo"
2. Select your `protectpibble` repository
3. Railway will detect it's a Python project
4. It will create a service automatically

### 2.4 Configure Backend Environment Variables

1. Click on your backend service (not the database)
2. Go to **Variables** tab
3. Add these variables:

   **Variable 1:**
   - Click "New Variable"
   - Name: `DATABASE_URL`
   - Value: `${{ Postgres.DATABASE_URL }}`
   - Click "Add"
   
   **Note:** `${{ Postgres.DATABASE_URL }}` is Railway's syntax to automatically reference the database connection from your PostgreSQL service. Railway will replace this with the actual connection string.

   **Variable 2:**
   - Click "New Variable"
   - Name: `ENV`
   - Value: `production`
   - Click "Add"

   **Variable 3:**
   - Click "New Variable"
   - Name: `CORS_ORIGINS`
   - Value: `https://your-app.vercel.app` (we'll update this after frontend deploys - placeholder for now)
   - Click "Add"

4. Railway will automatically redeploy when you add variables

### 2.5 Run Database Migrations

1. In Railway, click on your backend service
2. Go to **Deployments** tab
3. Click the three dots "..." on the latest deployment
4. Click "Open Shell"
5. In the shell, run:
   ```bash
   cd backend
   alembic upgrade head
   ```
6. You should see: `INFO  [alembic.runtime.migration] Running upgrade  -> 0001_create_mvp_tables`

✅ **Database migrations complete!**

### 2.6 Get Your Backend URL

1. Wait for deployment to finish (green "Deployed" status)
2. Click **Settings** tab
3. Scroll to "Domains"
4. Click "Generate Domain"
5. Copy the URL (e.g., `https://protectpibble-production.up.railway.app`)
6. **Save this URL** - you'll need it for the frontend!

### 2.7 Test Backend

1. Open the Railway URL in a browser
2. Add `/health` to the end (e.g., `https://your-app.railway.app/health`)
3. You should see: `{"ok":true}`
4. Try `/docs` to see the API documentation

✅ **Backend is live!**

---

---

## Step 3: Deploy Frontend to Vercel (5 min)

### 4.1 Create Vercel Account

1. Go to https://vercel.com
2. Click "Sign Up"
3. Sign in with GitHub
4. Authorize Vercel

### 3.2 Deploy Frontend

1. Click "Add New..." → "Project"
2. Import your `protectpibble` repository
3. Configure:
   - **Framework Preset**: Vite (should auto-detect)
   - **Root Directory**: `frontend` (IMPORTANT!)
   - **Build Command**: `npm run build` (should be auto-filled)
   - **Output Directory**: `dist` (should be auto-filled)
4. Click "Deploy"

### 4.3 Add Environment Variable

1. While deploying, go to **Settings** → **Environment Variables**
2. Add new variable:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: Your Railway backend URL (from Step 3.4)
   - **Environment**: Production, Preview, Development (check all)
3. Click "Save"
4. Go back to **Deployments** tab
5. Click the "..." menu on the latest deployment → "Redeploy"
6. Wait for redeploy to finish

### 3.4 Get Your Frontend URL

1. After deployment, you'll see your Vercel URL
2. It looks like: `https://protectpibble-xxxxx.vercel.app`
3. **Save this URL!**

### 3.5 Test Frontend

1. Open your Vercel URL in a browser
2. You should see the ProtectPibble login page
3. Try logging in with:
   - Email: `test@example.com`
   - Name: `Test User`

✅ **Frontend is live!**

---

## Step 5: Connect Frontend and Backend (2 min)

### 5.1 Update Backend CORS

1. Go back to Railway dashboard
2. Click on your backend service
3. Go to **Variables** tab
4. Find `CORS_ORIGINS` variable
5. Click "Edit"
6. Update value to your Vercel URL (e.g., `https://protectpibble-xxxxx.vercel.app`)
7. Railway will automatically redeploy

### 4.2 Test Everything

1. Go to your Vercel frontend URL
2. Log in
3. Create a group
4. Try creating a task
5. Everything should work! 🎉

---

## Step 6: Share with Others!

1. **Get your invite code:**
   - Log into your app
   - Create a group
   - Copy the invite code (shown on the groups page)

2. **Share with classmates:**
   - Send them your Vercel URL
   - Tell them to:
     1. Visit the URL
     2. Log in with their email and name
     3. Click "Join group"
     4. Enter the invite code

3. **Everyone can now:**
   - See the same tasks
   - Mark tasks as complete
   - See the shared pet's health
   - View the leaderboard (in FRIEND mode)

---

## 🎉 You're Done!

Your app is now live and accessible to everyone!

### Your URLs:
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-app.railway.app
- **API Docs**: https://your-app.railway.app/docs

### Troubleshooting

**"CORS error" in browser console?**
- Make sure `CORS_ORIGINS` in Railway matches your Vercel URL exactly
- No trailing slashes
- Include `https://`

**"Failed to fetch" errors?**
- Check `VITE_API_BASE_URL` in Vercel matches your Railway URL
- Make sure backend is running (check Railway dashboard)

**Database errors?**
- Verify `DATABASE_URL` in Railway is correct
- Make sure migrations ran successfully (Step 2.3)

**Need help?**
- Check Railway logs: Railway dashboard → Your service → Deployments → Click deployment → View logs
- Check Vercel logs: Vercel dashboard → Your project → Deployments → Click deployment → View logs

---

## Optional: Set Up Worker for Automatic Penalties

The worker automatically applies penalties for missed deadlines. To set it up:

1. In Railway, click "New" → "Empty Service"
2. Connect to your GitHub repo
3. Set start command: `cd backend && python -m workers.apply_deadline_penalties`
4. Add same environment variables as backend
5. Deploy

Or run manually when needed - penalties are also applied when viewing the dashboard.

---

## Cost

Both services have free tiers that should be enough for a class project:
- **Vercel**: Free (100GB bandwidth/month)
- **Railway**: Free ($5 credit/month - includes database!)

For ~50 users, you should be well within free limits!

## Why Only 2 Services?

- **Vercel** is the best option for React/Vite frontends (fast, free, easy)
- **Railway** can host both your backend AND provide PostgreSQL database (simpler than using 3 services!)
- This reduces complexity and makes deployment faster
