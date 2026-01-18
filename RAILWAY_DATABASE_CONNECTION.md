# Railway Database Connection - Use Variable Reference

Railway uses a special syntax to connect services. Instead of using the direct connection string, use Railway's variable reference.

## How to Connect Backend to Database

### In Your Backend Service Variables:

1. Go to your **backend service** in Railway
2. Click **Variables** tab
3. Add new variable:
   - **Name**: `DATABASE_URL`
   - **Value**: `${{ Postgres.DATABASE_URL }}`
   - Click **"Add"**

### What This Does

- `${{ Postgres.DATABASE_URL }}` is Railway's syntax to reference a variable from another service
- Railway automatically replaces this with the actual database connection string
- This keeps the connection secure and automatically updates if the database URL changes

### Your Backend Service Should Have These Variables:

1. **DATABASE_URL**: `${{ Postgres.DATABASE_URL }}`
2. **ENV**: `production`
3. **CORS_ORIGINS**: `https://protect-pibble.vercel.app`

### After Adding Variables

1. Railway will automatically redeploy your backend
2. The backend will now be connected to your PostgreSQL database
3. You can verify by checking the deployment logs

### Run Migrations

After the backend redeploys:

1. Go to backend service → **Deployments** tab
2. Click **"..."** on latest deployment → **"Open Shell"**
3. Run:
   ```bash
   cd backend
   alembic upgrade head
   ```

### Verify Connection

Check the deployment logs - you should see the backend starting successfully without database connection errors.

## Why Use Variable Reference?

- ✅ Automatic connection management
- ✅ Secure - no hardcoded passwords
- ✅ Updates automatically if database URL changes
- ✅ Railway best practice
