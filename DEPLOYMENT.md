# Deployment Guide

This guide will help you deploy ProtectPibble so multiple people can access it online from their own computers.

## Architecture Overview

- **Frontend**: Deploy to Vercel (recommended) or similar
- **Backend**: Deploy to Railway (recommended), Render, or Fly.io
- **Database**: PostgreSQL from Railway, Supabase, Neon, or Render
- **Worker** (optional): Same as backend or separate service

## Prerequisites

1. GitHub account (for connecting deployments)
2. Accounts on:
   - [Vercel](https://vercel.com) (free tier available)
   - [Railway](https://railway.app) (free tier available) OR [Render](https://render.com) (free tier available)
   - [Supabase](https://supabase.com) OR [Neon](https://neon.tech) for PostgreSQL (free tiers available)

## Step 1: Set Up PostgreSQL Database

### Option A: Railway PostgreSQL

1. Go to [Railway](https://railway.app) and sign in
2. Click "New Project" → "Provision PostgreSQL"
3. Copy the `DATABASE_URL` from the PostgreSQL service
4. Keep this URL safe - you'll need it for the backend

### Option B: Supabase

1. Go to [Supabase](https://supabase.com) and create a project
2. Go to Settings → Database
3. Copy the "Connection string" (URI format)
4. Replace `[YOUR-PASSWORD]` with your database password

### Option C: Neon

1. Go to [Neon](https://neon.tech) and create a project
2. Copy the connection string from the dashboard

## Step 2: Run Database Migrations

Before deploying, run migrations on your production database:

```bash
# Set your production DATABASE_URL
export DATABASE_URL="postgresql+psycopg://user:pass@host:port/dbname"

# Run migrations
cd backend
. .venv/bin/activate
alembic upgrade head
```

Or use Railway CLI:
```bash
railway run alembic upgrade head
```

## Step 3: Deploy Backend

### Option A: Railway (Recommended - Easiest)

1. Go to [Railway](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your ProtectPibble repository
4. Railway will auto-detect the backend
5. Add environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `ENV`: `production`
   - `CORS_ORIGINS`: Your frontend URL (e.g., `https://yourapp.vercel.app`)
   - `REDIS_URL`: (optional, for workers) - can use Railway Redis or Upstash
6. Railway will automatically deploy
7. Copy the deployment URL (e.g., `https://yourapp.railway.app`)

### Option B: Render

1. Go to [Render](https://render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `protectpibble-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (same as Railway)
6. Deploy
7. Copy the deployment URL

## Step 4: Deploy Frontend to Vercel

1. Go to [Vercel](https://vercel.com) and sign in
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variables:
   - `VITE_API_BASE_URL`: Your backend URL (e.g., `https://yourapp.railway.app`)
6. Deploy
7. Copy your frontend URL (e.g., `https://yourapp.vercel.app`)

## Step 5: Update Backend CORS

After deploying the frontend, update your backend's `CORS_ORIGINS` environment variable:

- Railway: Go to your backend service → Variables → Add `CORS_ORIGINS` = `https://yourapp.vercel.app`
- Render: Go to your service → Environment → Add `CORS_ORIGINS` = `https://yourapp.vercel.app`

If you have multiple domains, use comma-separated: `https://yourapp.vercel.app,https://www.yourapp.com`

## Step 6: Test Deployment

1. Visit your frontend URL
2. Try logging in (demo auth)
3. Create a group
4. Share the invite code with others
5. Have others join and test

## Step 7: (Optional) Set Up Worker for Deadline Penalties

The worker automatically applies penalties for missed deadlines. You can run it:

### Option A: Railway Cron Job

1. In Railway, add a new service
2. Use the same repo
3. Set start command: `cd backend && python -m workers.apply_deadline_penalties`
4. Set `WORKER_INTERVAL_SECONDS=60` (or your preferred interval)

### Option B: Render Cron Job

1. In Render, create a "Background Worker"
2. Use the same settings as backend
3. Set start command: `cd backend && python -m workers.apply_deadline_penalties`

### Option C: Manual Trigger

You can also trigger penalties manually via API or run them on-demand.

## Environment Variables Summary

### Backend (Railway/Render)

```
DATABASE_URL=postgresql+psycopg://user:pass@host:port/dbname
ENV=production
CORS_ORIGINS=https://yourapp.vercel.app
REDIS_URL=redis://... (optional, for workers)
CLERK_ISSUER=... (optional, for Clerk auth)
CLERK_JWKS_URL=... (optional, for Clerk auth)
```

### Frontend (Vercel)

```
VITE_API_BASE_URL=https://yourapp.railway.app
VITE_CLERK_PUBLISHABLE_KEY=... (optional, for Clerk auth)
```

## Troubleshooting

### CORS Errors

- Make sure `CORS_ORIGINS` in backend includes your frontend URL
- Check that URLs don't have trailing slashes
- Verify the frontend is using the correct `VITE_API_BASE_URL`

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check that your database allows connections from your backend's IP
- For Railway/Supabase/Neon, usually no IP whitelisting needed

### Frontend Can't Reach Backend

- Check `VITE_API_BASE_URL` is set correctly
- Verify backend is running (check `/health` endpoint)
- Check browser console for errors

### Migrations Not Applied

- Run `alembic upgrade head` manually on production database
- Check that `DATABASE_URL` is correct in your backend environment

## Custom Domain (Optional)

### Vercel Custom Domain

1. In Vercel dashboard, go to your project → Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions

### Backend Custom Domain

- Railway: Add custom domain in service settings
- Render: Add custom domain in service settings

Remember to update `CORS_ORIGINS` with your custom domain!

## Security Notes

- Currently using demo auth (X-Demo-Email header) - suitable for MVP/testing
- For production, consider implementing Clerk or similar auth
- Keep `DATABASE_URL` and other secrets secure (never commit to git)
- Use environment variables for all sensitive data

## Cost Estimates

- **Vercel**: Free tier includes 100GB bandwidth/month
- **Railway**: Free tier includes $5 credit/month
- **Render**: Free tier available (with limitations)
- **Supabase/Neon**: Free tiers available for small projects

For a class project with ~50 users, free tiers should be sufficient.

## Next Steps

1. Set up Clerk authentication (optional but recommended)
2. Configure custom domains (optional)
3. Set up monitoring/logging
4. Configure automatic backups for database
