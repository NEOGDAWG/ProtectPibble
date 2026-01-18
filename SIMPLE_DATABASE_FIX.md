# Simple Database Fix - Step by Step

Let's fix this simply. The issue is the database URL format.

## What You Need to Do

### 1. Get the Correct Database URL

1. In Render, click on your **PostgreSQL service** (the database)
2. Go to **Info** tab
3. Find **"Internal Database URL"**
4. Copy it - it looks like:
   ```
   postgresql://protectpibble:password@dpg-xxxxx.render.com:5432/protectpibble
   ```

### 2. Fix the Format

Take that URL and change the beginning:
- **From:** `postgresql://`
- **To:** `postgresql+psycopg://`

So if your Internal Database URL is:
```
postgresql://protectpibble:password@dpg-xxxxx.render.com:5432/protectpibble
```

Change it to:
```
postgresql+psycopg://protectpibble:password@dpg-xxxxx.render.com:5432/protectpibble
```

### 3. Update Backend Environment Variable

1. In Render, click on your **backend service** (not the database)
2. Go to **Settings** → **Environment Variables**
3. Find `DATABASE_URL`
4. Click **"Edit"** or the pencil icon
5. **Delete the old value**
6. **Paste the new value** (with `postgresql+psycopg://`)
7. Click **"Save"**

### 4. Wait for Redeploy

Render will automatically redeploy. Wait 1-2 minutes.

### 5. Check Logs

After redeploy, check the logs. You should see:
- ✅ No "falling back to SQLite" message
- ✅ Backend starting normally
- ✅ Migrations running automatically

## Why This Happens

- `postgresql://` makes SQLAlchemy look for `psycopg2` (old version)
- `postgresql+psycopg://` makes SQLAlchemy use `psycopg` (version 3, which you have)
- Your requirements.txt has `psycopg[binary]` which is version 3

## That's It!

Once the URL format is correct, the backend will connect to PostgreSQL automatically.
