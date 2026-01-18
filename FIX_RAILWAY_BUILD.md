# Fix Railway Build Error

The error shows Railway is trying to use Docker instead of Nixpacks. Here's how to fix it:

## Option 1: Configure Service in Railway Dashboard (Easiest)

1. In Railway, click on your **backend service**
2. Go to **Settings** tab
3. Scroll to **"Build & Deploy"** section
4. Set:
   - **Build Command**: (leave empty - Nixpacks will auto-detect)
   - **Start Command**: `cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: (leave empty - use repo root)
5. Scroll to **"Builder"**
6. Make sure it's set to **"Nixpacks"** (not Docker)
7. Save and redeploy

## Option 2: Delete and Redeploy Service

If Option 1 doesn't work:

1. In Railway, delete the current backend service
2. Click **"New"** → **"GitHub Repo"**
3. Select your `ProtectPibble` repository
4. Railway should auto-detect Python
5. **Before it starts building**, go to **Settings**:
   - Set **Start Command**: `cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Verify **Builder** is set to **"Nixpacks"**
6. Add your environment variables:
   - `DATABASE_URL` = `${{ Postgres.DATABASE_URL }}`
   - `ENV` = `production`
   - `CORS_ORIGINS` = `https://protect-pibble.vercel.app`

## Option 3: Create a Dockerfile (If Nixpacks Won't Work)

If Railway keeps trying to use Docker, create a Dockerfile:

Create `Dockerfile` in the repo root:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy requirements
COPY backend/requirements.txt /app/requirements.txt

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ /app/

# Expose port
EXPOSE $PORT

# Run the app
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Then Railway will use this Dockerfile.

## Recommended: Use Option 1

The easiest fix is to configure the service in Railway dashboard to use Nixpacks and set the start command correctly.
