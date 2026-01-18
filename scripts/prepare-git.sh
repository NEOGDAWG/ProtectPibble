#!/usr/bin/env bash
# Helper script to prepare git for deployment

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "📦 Preparing git for deployment..."
echo ""

# Check if git is initialized
if [ ! -d "${ROOT_DIR}/.git" ]; then
  echo "Initializing git..."
  cd "${ROOT_DIR}"
  git init
  echo "✅ Git initialized"
else
  echo "✅ Git already initialized"
fi

# Check current status
echo ""
echo "Current git status:"
git status --short || true

echo ""
echo "To commit and push:"
echo "1. git add ."
echo "2. git commit -m 'Ready for deployment'"
echo "3. git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
echo "4. git branch -M main"
echo "5. git push -u origin main"
echo ""
echo "Or if you already have a remote:"
echo "1. git add ."
echo "2. git commit -m 'Ready for deployment'"
echo "3. git push"
