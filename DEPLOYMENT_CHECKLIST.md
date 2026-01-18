# ✅ Deployment Checklist

Use this checklist to track your progress. Check off each item as you complete it.

## Pre-Deployment
- [ ] Code is ready (run `./scripts/check-deployment-ready.sh`)
- [ ] GitHub account created
- [ ] Repository created on GitHub
- [ ] Code pushed to GitHub

## Database Setup
- [ ] Supabase account created
- [ ] New project created in Supabase
- [ ] Database password saved securely
- [ ] Connection string copied
- [ ] Migrations run successfully (`alembic upgrade head`)

## Backend Deployment
- [ ] Railway account created
- [ ] Backend service deployed to Railway
- [ ] `DATABASE_URL` environment variable set
- [ ] `ENV=production` environment variable set
- [ ] `CORS_ORIGINS` environment variable set (placeholder for now)
- [ ] Backend URL copied (e.g., `https://xxx.railway.app`)
- [ ] Backend health check works (`/health` endpoint)
- [ ] API docs accessible (`/docs` endpoint)

## Frontend Deployment
- [ ] Vercel account created
- [ ] Frontend deployed to Vercel
- [ ] Root directory set to `frontend`
- [ ] `VITE_API_BASE_URL` environment variable set to backend URL
- [ ] Frontend URL copied (e.g., `https://xxx.vercel.app`)
- [ ] Frontend loads successfully

## Final Configuration
- [ ] Updated `CORS_ORIGINS` in Railway with Vercel URL
- [ ] Tested login on frontend
- [ ] Tested creating a group
- [ ] Tested creating a task
- [ ] Tested marking task complete

## Sharing
- [ ] Created a test group
- [ ] Copied invite code
- [ ] Shared frontend URL with others
- [ ] Verified others can join and use the app

## Optional
- [ ] Worker service set up (for automatic penalties)
- [ ] Custom domain configured
- [ ] Monitoring/logging set up

---

## Quick Reference

**Your URLs:**
- Frontend: `___________________________`
- Backend: `___________________________`
- Database: `___________________________` (Supabase project)

**Important Info:**
- Invite Code: `___________________________`
- Database Password: `___________________________` (keep secure!)

---

## Need Help?

- **Backend not working?** Check Railway logs
- **Frontend not working?** Check Vercel logs
- **CORS errors?** Verify `CORS_ORIGINS` matches frontend URL exactly
- **Database errors?** Verify `DATABASE_URL` is correct and migrations ran

See `DEPLOY_NOW.md` for detailed step-by-step instructions.
