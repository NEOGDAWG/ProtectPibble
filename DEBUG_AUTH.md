# Debug "Not authenticated" Error

The "Not authenticated" message means the backend isn't receiving authentication. Here's how to debug:

## Check What's Happening

### 1. Open Browser Console

1. Visit your app: https://protect-pibble.vercel.app/
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Look for any errors

### 2. Check Network Requests

1. In Developer Tools, go to **Network** tab
2. Refresh the page
3. Look for the `/groups/my` request
4. Click on it
5. Check:
   - **Request Headers** - Do you see `X-Demo-Email` and `X-Demo-Name`?
   - **Response** - What error message does it show?

### 3. Check What's Stored

1. In Developer Tools, go to **Application** tab (or **Storage**)
2. Click **Local Storage** → your domain
3. Check if you see:
   - `protectpibble.demoEmail` = your email
   - `protectpibble.demoName` = your name

## Common Issues

**If headers are missing:**
- The frontend isn't sending them
- Check if `getDemoIdentity()` is returning the identity

**If headers are present but still failing:**
- Backend might not be receiving them
- Check CORS settings
- Check backend logs in Render

**If localStorage is empty:**
- You need to log in again
- Go to `/login` and sign in with email/password
- Or use the old demo login (if still available)

## Quick Fix: Use Proper Login

Since we now have proper authentication:

1. **Logout** (clear old demo auth)
2. Go to **/register** or **/login**
3. **Register** a new account with email/password
4. This will create a JWT token and work properly

The demo auth should still work, but if it's not, the proper solution is to use the new registration/login system!
