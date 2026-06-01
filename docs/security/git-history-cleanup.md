# Git History Cleanup Guide — Elora Vault

> **Created:** 2026-06-01
> **Purpose:** Remove exposed secrets (private keys, API tokens, database passwords) from Elora Vault's git history

---

## Why this matters

The Elora Vault repository previously tracked `.env.production` and `.env.vercel`
containing:

- A deployer private key
- An Alchemy API key
- A Vercel OIDC token
- Supabase database credentials (plaintext password)

Even though these files are now removed from the current commit and gitignore'd,
they still exist in **prior git history**. Anyone who clones the repo — now or
in the future — can run `git log -p` and find them.

The only complete fix is to **rewrite history** to purge those files entirely.

---

## ⚠️ Important warnings

**This rewrites git history.** If other people have cloned the repo, they will
need to re-clone or rebase. Vercel will also need a fresh deploy.

**Backup your working directory** before running any of these commands.

**Rotate secrets before cleanup.** Even after cleanup, anyone who already has
a clone can still access the old secrets. Revoke the exposed keys first.

---

## Option A: git filter-repo (recommended)

`git filter-repo` is the modern, fast, and officially recommended tool.

### 1. Install git filter-repo

```bash
# macOS
brew install git-filter-repo

# Linux (apt)
sudo apt install git-filter-repo

# pip
pip install git-filter-repo

# Or download the standalone script:
curl -L -o /usr/local/bin/git-filter-repo https://raw.githubusercontent.com/newren/git-filter-repo/main/git-filter-repo
chmod +x /usr/local/bin/git-filter-repo
```

### 2. Create a fresh clone (never run on the original)

```bash
cd /tmp
git clone https://github.com/sparshsam/elora-vault.git elora-vault-clean
cd elora-vault-clean
```

### 3. Remove the offending files from all history

```bash
# Remove .env.production, .env.vercel, and vercel-env.txt from all commits
git filter-repo --path .env.production --path .env.vercel --path vercel-env.txt --invert-paths

# Verify they're gone
git log --all --full-history -- .env.production | head -5
# Should return nothing
```

### 4. Force push the rewritten history

```bash
git remote add origin https://github.com/sparshsam/elora-vault.git
git push origin main --force
```

### 5. Rotate Vercel deploy hook if using one

Vercel deployments tied to the original commit SHAs may break. Force-pushing
creates new commit SHAs. Vercel should auto-deploy the new `main` branch.

---

## Option B: BFG Repo-Cleaner (simpler alternative)

[BFG](https://rtyley.github.io/bfg-repo-cleaner/) is faster for removing large
files. For small config files, it works just as well.

### 1. Install BFG

```bash
brew install bfg  # macOS
# Or download the jar: https://rtyley.github.io/bfg-repo-cleaner/
```

### 2. Create a fresh clone and clean

```bash
cd /tmp
git clone --mirror https://github.com/sparshsam/elora-vault.git elora-vault-mirror.git
cd elora-vault-mirror.git

# Delete the offending files from all branches
bfg --delete-files .env.production --delete-files .env.vercel --delete-files vercel-env.txt

# Clean up the ref-log and garbage collect
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

### 3. Force push

```bash
git push origin --force --all
git push origin --force --tags
```

---

## Option C: git filter-branch (last resort)

`git filter-branch` is slower and deprecated, but available everywhere without
extra tools.

```bash
cd /tmp
git clone https://github.com/sparshsam/elora-vault.git elora-vault-filtered
cd elora-vault-filtered

git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.production .env.vercel vercel-env.txt" \
  --prune-empty --tag-name-filter cat -- --all

git push origin --force --all
git push origin --force --tags
```

---

## Post-cleanup checklist

- [ ] All three files (` .env.production`, `.env.vercel`, `vercel-env.txt`) removed from history
- [ ] Force-push succeeded to `origin/main`
- [ ] All team members re-clone (not pull — the old commits are gone)
- [ ] Vercel auto-deploy triggered (check Vercel dashboard)
- [ ] CI passes on the force-pushed commit
- [ ] Exposed keys rotated (deployer, Alchemy, Vercel OIDC, Supabase DB password)

---

## Vercel redeploy considerations

After force-pushing:

1. **Vercel should auto-deploy** when `main` is force-pushed
2. If it doesn't, manually trigger a deploy from the Vercel dashboard:
   - Go to your project → Deployments → Trigger Deployment
3. **Environment variables are unaffected** — Vercel stores them in the dashboard,
   not in `.env.production`
4. If you use Vercel's automatic `VERCEL_GIT_COMMIT_SHA` in your app, note that
   commit SHAs have changed — but this is read-only metadata and won't affect
   functionality

---

## Preventing future leaks

The following are now in `.gitignore` and should never be committed again:

```
.env*.local
.env
.env.production
.env.vercel
vercel-env.txt
force-deploy.txt
```

Add a pre-commit hook to catch accidental secret commits:

```bash
# .githooks/pre-commit
#!/bin/bash
# Block commits containing .env files or known secret patterns
if git diff --cached --name-only | grep -E '\.env\.(production|vercel|staging)$'; then
  echo "ERROR: .env.production/.env.vercel files must not be committed."
  exit 1
fi
```

Install it:

```bash
git config core.hooksPath .githooks
```
