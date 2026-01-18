# How to Run Migrations in Render Shell

Here's exactly how to run database migrations in Render:

## Step-by-Step

### 1. Open Your Backend Service

1. Go to Render dashboard
2. Click on your **backend service** (the one running your FastAPI app)
3. You should see tabs: **Logs**, **Metrics**, **Shell**, **Settings**, etc.

### 2. Open Shell

1. Click on the **"Shell"** tab
2. You'll see a button that says **"Open Shell"** or **"Connect"**
3. Click it
4. A terminal window will open in your browser

### 3. Navigate to Backend Directory

In the shell, you need to go to the backend directory:

```bash
cd backend
```

### 4. Run Migrations

Once you're in the backend directory, run:

```bash
alembic upgrade head
```

### 5. Verify Success

You should see output like:
```
INFO  [alembic.runtime.migration] Running upgrade  -> 0001_create_mvp_tables, Create MVP tables
```

If you see this, migrations ran successfully! ✅

## Visual Guide

```
Render Dashboard
  └─ Your Backend Service
      └─ Shell Tab
          └─ [Open Shell Button]
              └─ Terminal Opens
                  └─ Type: cd backend
                  └─ Type: alembic upgrade head
```

## Common Issues

**"alembic: command not found"**
- Make sure you're in the `backend` directory
- Try: `python -m alembic upgrade head`

**"No such file or directory: alembic.ini"**
- You need to be in the `backend` directory first
- Run: `cd backend` then `alembic upgrade head`

**"Can't connect to database"**
- Make sure `DATABASE_URL` is set correctly in Environment Variables
- Verify it uses `postgresql+psycopg://` format
- Check that the database service is running

**"No changes detected"**
- This means migrations are already up to date - that's fine!

## Alternative: Run from Local Machine

If Render Shell doesn't work, you can run migrations from your local machine:

1. Set your local `DATABASE_URL` to the Render database URL
2. Run: `cd backend && alembic upgrade head`

But using Render Shell is easier!

## After Migrations

Once migrations complete:
1. Your database tables are created
2. Backend should be able to connect
3. Test: `https://your-backend.onrender.com/health`
4. Should see: `{"ok":true}`

Then your app should work! 🎉
