#!/bin/bash
# ============================================================
# F-02 FIX: Purge TLS private key from git history
# Lexora Library Management System
# ============================================================
# PURPOSE:
#   Removes client/certs/key.pem and client/certs/cert.pem
#   from ALL commits in git history so the private key can
#   never be recovered from the repository.
#
# RUN FROM: your project root (where .git folder is)
#
# PREREQUISITES:
#   - Commit or stash any uncommitted changes first
#   - All team members must re-clone after this is done
#   - If repo is on GitHub/GitLab, you must force-push
# ============================================================

set -e

echo "============================================"
echo " F-02: Purging certs from git history"
echo "============================================"
echo ""

# ── STEP 1: Verify we are in a git repo ──────────────────────
if [ ! -d ".git" ]; then
  echo "ERROR: Run this from your project root (where .git is)"
  exit 1
fi
echo "[1/6] Git repo confirmed."

# ── STEP 2: Check for uncommitted changes ────────────────────
if ! git diff-index --quiet HEAD --; then
  echo "ERROR: You have uncommitted changes."
  echo "       Run: git stash   (then re-run this script)"
  exit 1
fi
echo "[2/6] Working tree is clean."

# ── STEP 3: Update .gitignore FIRST ──────────────────────────
echo "[3/6] Ensuring .gitignore blocks certs..."
if ! grep -q "client/certs/" .gitignore 2>/dev/null; then
  echo "client/certs/" >> .gitignore
  echo "*.pem"         >> .gitignore
  echo "*.key"         >> .gitignore
  git add .gitignore
  git commit -m "security: add certs and secrets to .gitignore"
fi
echo "      .gitignore updated."

# ── STEP 4: Remove files from git tracking (keep local copy) ─
echo "[4/6] Untracking cert files (keeping local copies)..."
git rm --cached client/certs/key.pem  2>/dev/null && echo "      Untracked: client/certs/key.pem"  || echo "      (key.pem was not tracked)"
git rm --cached client/certs/cert.pem 2>/dev/null && echo "      Untracked: client/certs/cert.pem" || echo "      (cert.pem was not tracked)"
git commit -m "security: remove TLS certificates from tracking" 2>/dev/null || echo "      (nothing new to commit)"

# ── STEP 5: Purge from ALL historical commits ─────────────────
echo "[5/6] Rewriting git history to remove certs from all commits..."
echo "      This may take a moment..."

git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch client/certs/key.pem client/certs/cert.pem' \
  --prune-empty --tag-name-filter cat -- --all

# Clean up filter-branch refs
git for-each-ref --format="%(refname)" refs/original/ | \
  xargs -r git update-ref -d

git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "      History rewritten and garbage collected."

# ── STEP 6: Force push (if using remote) ─────────────────────
echo ""
echo "[6/6] If you have a remote repository, run:"
echo ""
echo "      git push origin --force --all"
echo "      git push origin --force --tags"
echo ""
echo "============================================"
echo " DONE. Private key purged from git history."
echo "============================================"
echo ""
echo "IMPORTANT — Do these now:"
echo "  1. Generate a NEW certificate and key pair (the old one"
echo "     may have been seen — treat it as compromised)"
echo "  2. Store the new certs OUTSIDE the project directory"
echo "  3. Tell all team members to: git clone <repo> (fresh clone)"
echo "  4. Delete their local copies of the old repo"
echo ""
echo "  To generate a new self-signed cert for development:"
echo "  openssl req -x509 -newkey rsa:4096 -keyout key.pem \\"
echo "    -out cert.pem -days 365 -nodes \\"
echo "    -subj '/CN=localhost'"
echo "  Then store key.pem and cert.pem OUTSIDE the project,"
echo "  and reference them by absolute path in your config."
