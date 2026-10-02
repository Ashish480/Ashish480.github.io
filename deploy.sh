#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Publish the portfolio to GitHub Pages  →  https://ashish480.github.io
#
# One-time setup (takes a minute):
#   1. Go to https://github.com/new
#   2. Repository name:  Ashish480.github.io   (exactly this), Public, no README
#   3. Click "Create repository"
#
# Then, every time you want to publish changes, run from this folder:
#   ./deploy.sh                    # uses the message "Update portfolio"
#   ./deploy.sh "Add new project"  # or your own message
# ---------------------------------------------------------------------------
set -euo pipefail

REPO_URL="https://github.com/Ashish480/Ashish480.github.io.git"
SITE_URL="https://ashish480.github.io"
MESSAGE="${1:-Update portfolio}"

cd "$(dirname "$0")"

if [ ! -d .git ]; then
  echo "→ Setting up git in this folder"
  git init -q
  git branch -M main
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "$REPO_URL"
fi

git add -A
if git diff --cached --quiet; then
  echo "→ No changes to commit"
else
  git commit -q -m "$MESSAGE"
  echo "→ Committed: $MESSAGE"
fi

echo "→ Pushing to GitHub…"
git push -u origin main

echo
echo "✓ Published. GitHub takes about a minute to build, then your site is live at:"
echo "  $SITE_URL"
