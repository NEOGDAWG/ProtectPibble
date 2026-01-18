# Quick Deployment Guide

Get ProtectPibble online in ~15 minutes!

## Prerequisites

- GitHub account
- Accounts on Vercel and Railway (both free)

## Step 1: Deploy Backend + Database (5 min)

Railway provides both backend hosting AND the database!

1. Go to [Railway](https://railway.app) → New Project
2. First, click "Provision PostgreSQL" (creates database)
3. Click on PostgreSQL service → Variables → Copy `DATABASE_URL`
4. Then click "New" → "GitHub Repo" → Select your repository
5. Railway auto-detects Python
6. Add environment variables:
   - `DATABASE_URL`: The one you copied from PostgreSQL service
   - `ENV`: `production`
   - `CORS_ORIGINS`: (leave empty for now, we'll add after frontend)
7. Wait for deployment
8. Open Shell in Railway → Run: `cd backend && alembic upgrade head`
9. Copy the Railway URL (e.g., `https://yourapp.railway.app`)

## Step 2: Deploy Frontend (3 min)

1. Go to [Vercel](https://vercel.com) → Add New → Project
2. Import your GitHub repo
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework**: Vite
4. Add environment variable:
   - `VITE_API_BASE_URL`: Your Railway backend URL
5. Deploy
6. Copy your Vercel URL (e.g., `https://yourapp.vercel.app`)

## Step 3: Update CORS (1 min)

1. Go back to Railway → Your backend service → Variables
2. Add/Update `CORS_ORIGINS`: Your Vercel URL (e.g., `https://yourapp.vercel.app`)
3. Railway will automatically redeploy

## Done! 🎉

Visit your Vercel URL and start using ProtectPibble!

### Share with Others

1. Create a group in the app
2. Share the invite code with classmates
3. They can join and see the same tasks!

## Troubleshooting

**CORS errors?**
- Make sure `CORS_ORIGINS` in Railway matches your Vercel URL exactly
- No trailing slashes

**Database connection failed?**
- Check `DATABASE_URL` is correct
- Make sure migrations ran successfully

**Frontend can't reach backend?**
- Verify `VITE_API_BASE_URL` is set correctly in Vercel
- Check backend is running (visit Railway URL + `/health`)

## Why Only 2 Services?

- **Vercel**: Best for React/Vite frontends (fast, free, easy)
- **Railway**: Can host backend AND provide PostgreSQL (simpler!)

No need for a separate database service - Railway does it all!

## Next Steps

- Set up Clerk authentication (optional)
- Configure custom domain (optional)
- Set up worker for automatic deadline penalties (see DEPLOYMENT.md)
