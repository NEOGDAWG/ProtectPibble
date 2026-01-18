#!/bin/bash
# Helper script to commit and push changes to GitHub

set -e

# Get the commit message from first argument, or use default
COMMIT_MSG="${1:-Update codebase}"

# Get the current branch
BRANCH=$(git branch --show-current)

echo "📝 Committing changes..."
git add -A

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "✅ No changes to commit"
    exit 0
fi

git commit -m "$COMMIT_MSG"

echo "🚀 Pushing to GitHub (branch: $BRANCH)..."
git push origin "$BRANCH"

echo "✅ Successfully pushed to GitHub!"
