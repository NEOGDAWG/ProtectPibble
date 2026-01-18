# Add CORS_ORIGINS Variable to Railway

Since you don't see `CORS_ORIGINS` yet, you need to add it. Here's how:

## Steps

1. **Go to Railway Dashboard**
   - Visit https://railway.app
   - Click on your **backend service** (the one that's running your Python/FastAPI code, not the PostgreSQL database)

2. **Go to Variables Tab**
   - Click on the **"Variables"** tab at the top

3. **Add New Variable**
   - Click the **"New Variable"** or **"+"** button
   - In the popup/form:
     - **Name**: `CORS_ORIGINS`
     - **Value**: `https://protect-pibble.vercel.app`
     - Click **"Add"** or **"Save"**

4. **Wait for Redeploy**
   - Railway will automatically detect the new variable
   - It will redeploy your backend (takes ~30-60 seconds)
   - You'll see a new deployment starting

5. **Verify**
   - Once deployment is complete (green "Deployed" status)
   - Your backend should now accept requests from your Vercel frontend!

## Visual Guide

```
Railway Dashboard
  └─ Your Backend Service
      └─ Variables Tab
          └─ [New Variable Button]
              └─ Name: CORS_ORIGINS
              └─ Value: https://protect-pibble.vercel.app
              └─ [Add]
```

## Important Notes

- **No trailing slash** - Use `https://protect-pibble.vercel.app` not `https://protect-pibble.vercel.app/`
- **Include https://** - Don't forget the protocol
- **Exact match** - The URL must match exactly what Vercel shows

## If You Have Multiple Frontends

If you need to allow multiple domains, separate them with commas:
```
https://protect-pibble.vercel.app,https://www.yourdomain.com
```

## Test After Adding

1. Wait for Railway to finish redeploying
2. Visit your frontend: https://protect-pibble.vercel.app/
3. Open browser console (F12)
4. Try logging in
5. If you see CORS errors, double-check the URL matches exactly
