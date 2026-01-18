# Fix "Failed to fetch" - Set VITE_API_BASE_URL in Vercel

## The Problem

The frontend is trying to connect to `http://127.0.0.1:8000` (localhost) instead of your Render backend. This causes "Failed to fetch" errors.

## The Solution

Set the `VITE_API_BASE_URL` environment variable in Vercel.

## Steps

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Click on your project: **protect-pibble**

2. **Open Settings**
   - Click **"Settings"** in the top navigation
   - Click **"Environment Variables"** in the left sidebar

3. **Add Environment Variable**
   - Click **"Add New"** or the **"+"** button
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** `https://protectpibble.onrender.com`
   - **Environment:** Select **Production**, **Preview**, and **Development** (or at least Production)
   - Click **"Save"**

4. **Redeploy**
   - Go to **"Deployments"** tab
   - Click the **"..."** menu on the latest deployment
   - Click **"Redeploy"**
   - Or push a new commit to trigger automatic redeploy

5. **Wait for Deployment**
   - Wait 1-2 minutes for Vercel to rebuild and deploy
   - Check the deployment logs to make sure it succeeded

6. **Test**
   - Go to your app: https://protect-pibble.vercel.app
   - Try registering again
   - The "Failed to fetch" error should be gone!

## Verify It's Working

After redeploying:
1. Open browser DevTools (F12)
2. Go to Console tab
3. You should see: `[API] Using backend URL: https://protectpibble.onrender.com`
4. If you see `http://127.0.0.1:8000`, the variable isn't set correctly

## Troubleshooting

**Still getting "Failed to fetch"?**
- Make sure `VITE_API_BASE_URL` is set to `https://protectpibble.onrender.com` (no trailing slash)
- Make sure you selected the right environments (at least Production)
- Make sure you redeployed after adding the variable
- Check Vercel deployment logs for any build errors
- Try hard refresh in browser (Cmd+Shift+R or Ctrl+Shift+R)

**The variable is set but still not working?**
- Environment variables starting with `VITE_` are only available at build time
- You MUST redeploy after adding/changing `VITE_*` variables
- Just saving the variable isn't enough - you need a new deployment

## Quick Checklist

- [ ] `VITE_API_BASE_URL` is set in Vercel
- [ ] Value is exactly: `https://protectpibble.onrender.com`
- [ ] Selected Production environment (at least)
- [ ] Redeployed after adding the variable
- [ ] Waited for deployment to complete
- [ ] Tested registration again

Once this is set, your frontend will connect to the Render backend and registration should work!
