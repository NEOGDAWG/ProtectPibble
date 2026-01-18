# Fix CORS Error - Add Vercel URL to Render

## The Problem

Your frontend at `https://protect-pibble.vercel.app` is trying to make requests to your backend at `https://protectpibble.onrender.com`, but the backend is blocking these requests because the Vercel URL is not in the allowed CORS origins.

## The Solution

Add the `CORS_ORIGINS` environment variable in Render with your Vercel URL.

## Steps

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Click on your backend service (the one running at `protectpibble.onrender.com`)

2. **Open Environment Variables**
   - In the left sidebar, click **"Environment"**
   - Or scroll down to the **"Environment Variables"** section

3. **Add CORS_ORIGINS Variable**
   - Click **"Add Environment Variable"** or the **"+"** button
   - **Key:** `CORS_ORIGINS`
   - **Value:** `https://protect-pibble.vercel.app`
   - Click **"Save Changes"**

4. **Redeploy**
   - Render should automatically redeploy when you save environment variables
   - If not, click **"Manual Deploy"** → **"Deploy latest commit"**

5. **Wait for Deployment**
   - Wait 1-2 minutes for the service to restart
   - Check the logs to make sure it started successfully

6. **Test**
   - Go back to your Vercel app: https://protect-pibble.vercel.app
   - Try registering again
   - The CORS error should be gone!

## Multiple Origins (Optional)

If you have multiple frontend URLs (e.g., production and staging), you can add them all separated by commas:

```
https://protect-pibble.vercel.app,https://staging.yourapp.com
```

## Verify It Worked

After adding the variable and redeploying:
1. The CORS error should disappear
2. You should be able to register/login successfully
3. Check the browser console - no more CORS errors!

## Troubleshooting

**Still getting CORS errors?**
- Make sure there are **no spaces** in the URL
- Make sure the URL starts with `https://` (not `http://`)
- Make sure the URL matches **exactly** what's in your browser (check for typos)
- Wait a few minutes for Render to fully restart
- Try hard refresh in browser (Cmd+Shift+R or Ctrl+Shift+R)

**Need to add more origins later?**
- Just edit the `CORS_ORIGINS` variable and add more URLs separated by commas
- Render will automatically redeploy
