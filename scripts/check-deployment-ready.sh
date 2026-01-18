#!/usr/bin/env bash
# Check if everything is ready for deployment

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🔍 Checking deployment readiness..."
echo ""

# Check if git is initialized
if [ ! -d "${ROOT_DIR}/.git" ]; then
  echo "❌ Git not initialized. Run: git init"
  exit 1
else
  echo "✅ Git initialized"
fi

# Check if vercel.json exists
if [ -f "${ROOT_DIR}/vercel.json" ]; then
  echo "✅ Vercel config found"
else
  echo "❌ vercel.json missing"
  exit 1
fi

# Check if railway.json exists
if [ -f "${ROOT_DIR}/railway.json" ]; then
  echo "✅ Railway config found"
else
  echo "❌ railway.json missing"
  exit 1
fi

# Check if backend requirements.txt exists
if [ -f "${ROOT_DIR}/backend/requirements.txt" ]; then
  echo "✅ Backend requirements.txt found"
else
  echo "❌ backend/requirements.txt missing"
  exit 1
fi

# Check if frontend package.json exists
if [ -f "${ROOT_DIR}/frontend/package.json" ]; then
  echo "✅ Frontend package.json found"
else
  echo "❌ frontend/package.json missing"
  exit 1
fi

# Check if .env is gitignored
if grep -q "^\.env$" "${ROOT_DIR}/.gitignore" 2>/dev/null; then
  echo "✅ .env is gitignored (good!)"
else
  echo "⚠️  .env might not be gitignored - check .gitignore"
fi

# Check if migrations exist
if [ -f "${ROOT_DIR}/backend/alembic/versions/0001_create_mvp_tables.py" ]; then
  echo "✅ Database migrations found"
else
  echo "❌ Database migrations missing"
  exit 1
fi

echo ""
echo "🎉 Everything looks ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Push code to GitHub (see DEPLOY_NOW.md)"
echo "2. Set up database (Supabase)"
echo "3. Deploy backend (Railway)"
echo "4. Deploy frontend (Vercel)"
echo ""
echo "See DEPLOY_NOW.md for detailed instructions."
