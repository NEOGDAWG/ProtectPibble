# Debug Steps for "Failed to fetch" Error

Since `VITE_API_BASE_URL` is set, let's debug step by step:

## Step 1: Verify Vercel Redeployed

**Important:** `VITE_*` environment variables are only available at **build time**. You MUST redeploy after setting them.

1. Go to Vercel Dashboard → Your Project → Deployments
2. Check the latest deployment timestamp
3. If it's BEFORE you set `VITE_API_BASE_URL`, you need to redeploy:
   - Click "..." on latest deployment → "Redeploy"
   - Or push a new commit

## Step 2: Check Browser Console

1. Open your app: https://protect-pibble.vercel.app
2. Open DevTools (F12)
3. Go to **Console** tab
4. Try registering
5. Look for:
   - `[API] Using backend URL: ...` - Should show `https://protectpibble.onrender.com`
   - `[API] Making request to: ...` - Should show the full URL
   - `[API] Request body (converted): ...` - Should show `display_name` (not `displayName`)
   - Any error messages

## Step 3: Check Network Tab

1. In DevTools, go to **Network** tab
2. Try registering
3. Look for the request to `/auth/register`
4. Click on it and check:
   - **Status:** What HTTP status code?
   - **Request URL:** Is it pointing to Render backend?
   - **Request Headers:** Check `Origin` header
   - **Response Headers:** Check for `Access-Control-Allow-Origin`
   - **Response:** What error message?

## Step 4: Check Render Logs

1. Go to Render Dashboard → Your Backend Service
2. Click **Logs** tab
3. Try registering from your app
4. Look for:
   - Any error messages
   - "Register request received" log (if you see this, request reached backend)
   - Database errors
   - CORS-related errors

## Step 5: Test Backend Directly

Run this in terminal to test if backend accepts the request:

```bash
curl -X POST https://protectpibble.onrender.com/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: https://protect-pibble.vercel.app" \
  -d '{"email":"test@example.com","display_name":"Test User","password":"Test1234"}'
```

If this works, the backend is fine. If it fails, check the error message.

## Common Issues

### Issue 1: Vercel Not Redeployed
**Symptom:** Console shows `http://127.0.0.1:8000` instead of Render URL
**Fix:** Redeploy Vercel

### Issue 2: CORS Preflight Failing
**Symptom:** Network tab shows OPTIONS request failing
**Fix:** Backend should handle OPTIONS (already configured)

### Issue 3: Field Name Mismatch
**Symptom:** Backend returns "Field required: display_name"
**Fix:** Frontend should convert `displayName` → `display_name` (already implemented)

### Issue 4: Backend Not Running
**Symptom:** Network tab shows connection refused/timeout
**Fix:** Check Render service is running

## What to Share

If still not working, share:
1. Browser console output (especially `[API]` logs)
2. Network tab details for the failed request
3. Render logs from when you tried to register
4. Result of the curl test above

This will help identify the exact issue!
