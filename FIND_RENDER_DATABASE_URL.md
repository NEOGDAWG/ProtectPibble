# Where to Find Render Database URL

Here's exactly where to find the Internal Database URL in Render:

## Step-by-Step

### 1. After Creating PostgreSQL Database

1. In Render dashboard, you'll see your PostgreSQL service
2. Click on it to open the database details

### 2. Go to "Info" Tab

1. You'll see several tabs: **Info**, **Connections**, **Backups**, etc.
2. Click on the **"Info"** tab (usually the default)

### 3. Find "Internal Database URL"

1. Scroll down in the Info tab
2. Look for a section called **"Connections"** or **"Database URLs"**
3. You'll see two URLs:
   - **Internal Database URL** ← Use this one!
   - **External Database URL** (ignore this)

### 4. Copy the Internal Database URL

The Internal Database URL looks like:
```
postgresql://protectpibble:password@dpg-xxxxx-a.oregon-postgres.render.com/protectpibble
```

**Click the copy icon** (📋) next to "Internal Database URL" to copy it.

## Visual Guide

```
Render Dashboard
  └─ Your PostgreSQL Service
      └─ Info Tab
          └─ Connections Section
              ├─ Internal Database URL ← COPY THIS!
              └─ External Database URL (don't use)
```

## Important Notes

- ✅ **Use Internal Database URL** - This works within Render's network
- ❌ **Don't use External Database URL** - That's for outside connections
- The Internal URL is what your backend service will use
- It's already formatted correctly - just copy and paste it!

## If You Can't Find It

1. Make sure you're on the **Info** tab (not Connections or Backups)
2. Scroll down - it might be below other information
3. Look for a section labeled "Connections" or "Database URLs"
4. If still can't find it, try the **Connections** tab - it might be there

## After Copying

1. Go to your backend service in Render
2. Settings → Environment Variables
3. Add new variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste the Internal Database URL you just copied
4. Save

That's it! The backend will automatically connect to the database.
