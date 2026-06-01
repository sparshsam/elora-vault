# Secret Remediation — Elora Vault

> **Phase:** 6.4F — Repository Secret Eradication
> **Created:** 2026-06-01
> **Priority:** Critical

---

## Context

The following secret-bearing files were previously committed to the repository
and are still present in git history:

| File | Contents |
|---|---|
| `.env.production` | Deployer private key, Alchemy API key, Vercel OIDC token, Supabase DB credentials, USDC contract address |
| `.env.vercel` | Deployer private key, Alchemy API key, Vercel OIDC token, Supabase DB credentials |
| `vercel-env.txt` | Vercel environment marker (minimal exposure) |

### Affected commits

These files appeared in the following commits (from earliest to latest):

| Commit | Date | Description |
|---|---|---|
| `c02f2ba` | May 29 | chore: add DATABASE_URL env |
| `e3dd69d` | May 30 | v0.5: update deployed Base Sepolia vault address |
| `f203579` | May 31 | Add Builder Code attribution foundation |
| `eb9cd47` | Jun 1 | Document Elora layer maturity statuses |
| `a5c70bb` | Jun 1 | Add production readiness and security review (files **removed from tracking**) |
| `5da55d6` | Jun 1 | Merge with remote changes (inherits removal) |

Commits `a5c70bb` and later no longer contain these files. However, commits
`c02f2ba` through `eb9cd47` still carry them in their trees.

### Known exposed values

- Deployer private key: `e599a5a823c3b0bcbfe8f93ca7f62b3254ef7a8d7fb7be1e2361cdf5207c2f11`
- Alchemy API key: `mJeNalyxWmI_7azEYtjWaF3sVRN9PFRV`
- Vault contract address (Base Sepolia): `0x7876A2fa21BAfD40F7b61F49390d0FED556Db1fd`
- USDC contract address (Base Sepolia): `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Supabase project URL: `https://qoxmibmbyjmkntzrckyr.supabase.co`
- Database password: `35Highpark*`

**These are all compromised.** Anyone with access to the repository (public
repo) can extract them from git history.

---

## 1. Pre-cleanup checklist (MUST do before rewriting history)

### 1.1 Rotate exposed secrets

Do this **before** any `git filter-repo` operation. The cleanup prevents
future exposure, but anyone who already has a clone already has the secrets.

| Secret | Where to rotate |
|---|---|
| Deployer private key | Generate a new wallet, redeploy contracts, update Vercel env vars |
| Alchemy API key | Alchemy Dashboard → Apps → your app → Rotate |
| Supabase DB password | Supabase Dashboard → Database → Settings → Reset database password |
| Vercel OIDC token | Vercel Dashboard → Settings → OIDC → Rotate |

### 1.2 Notify collaborators

If anyone else has cloned the repository, tell them they will need to
re-clone after the force-push. Their existing clones will have dangling
commit references.

### 1.3 Create a backup

```bash
# Full bare clone backup (safe to delete after verifying cleanup)
cd /tmp
git clone --mirror https://github.com/sparshsam/elora-vault.git elora-vault-backup.git
```

---

## 2. Git filter-repo workflow (recommended)

`git filter-repo` is the official, modern tool for history rewriting.
It is significantly faster and safer than the deprecated `git filter-branch`.

### 2.1 Install git filter-repo

```bash
# macOS
brew install git-filter-repo

# Linux (apt)
sudo apt install git-filter-repo

# pip (any OS)
pip install git-filter-repo

# Standalone script (any OS)
curl -L -o /usr/local/bin/git-filter-repo https://raw.githubusercontent.com/newren/git-filter-repo/main/git-filter-repo
chmod +x /usr/local/bin/git-filter-repo
```

### 2.2 Create a fresh clone (never run on the original)

Always work on a fresh clone — `git filter-repo` rewrites the local clone
in place.

```bash
cd /tmp
git clone https://github.com/sparshsam/elora-vault.git elora-vault-clean
cd elora-vault-clean
```

### 2.3 Remove the offending files from all history

```bash
git filter-repo \
  --path .env.production \
  --path .env.vercel \
  --path vercel-env.txt \
  --invert-paths
```

**What this does:**
- Scans every commit in every branch
- Deletes any occurrence of those three files
- Rewrites commit SHAs for any affected commit
- Preserves all other files and commit messages

> **Safety note:** `--invert-paths` means "keep everything EXCEPT these paths."
> Only the specified files are removed. No other files or commits are affected.

### 2.4 Verify the removal

```bash
# Confirm the files are gone from history
git log --all --full-history -- .env.production
# Should return nothing

git log --all --full-history -- .env.vercel
# Should return nothing

git log --all --full-history -- vercel-env.txt
# Should return nothing

# Confirm the key commits still exist (just without the env files)
git log --oneline -10
```

### 2.5 Restore the remote origin

`git filter-repo` removes remote configuration by default. Add it back:

```bash
git remote add origin https://github.com/sparshsam/elora-vault.git
```

### 2.6 Force push the rewritten history

```bash
git push origin main --force
```

**Force-push implications:**

- Commit SHAs for affected commits **will change**. Any system referencing
  specific commit SHAs (GitHub actions, deployment tags, issue references)
  may break.
- The `main` branch is overwritten with the cleaned version.
- All branches and tags that reference cleaned commits are also affected
  (add `--all` and `--tags` if needed).

```bash
# If you have other branches that also contained these files:
git push origin --force --all
git push origin --force --tags
```

### 2.7 Verify on GitHub

```bash
# Clone to a fresh directory to confirm
cd /tmp
git clone https://github.com/sparshsam/elora-vault.git elora-vault-verify
cd elora-vault-verify
git log --all --full-history -- .env.production
# Should return nothing
```

---

## 3. BFG Repo-Cleaner workflow (simpler alternative)

[BFG](https://rtyley.github.io/bfg-repo-cleaner/) is faster for removing
large files and simpler for specific file cleanup.

### 3.1 Download BFG

```bash
# Requires Java Runtime (JRE)
curl -L -o bfg.jar https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
```

### 3.2 Create a mirror clone and clean

```bash
cd /tmp
git clone --mirror https://github.com/sparshsam/elora-vault.git elora-vault-mirror.git
cd elora-vault-mirror.git

# Delete the offending files from all branches
java -jar ../bfg.jar --delete-files .env.production
java -jar ../bfg.jar --delete-files .env.vercel
java -jar ../bfg.jar --delete-files vercel-env.txt

# Clean up the ref-log and garbage collect
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### 3.3 Verify

```bash
# Check for any remaining references
git log --all --full-history -- .env.production
```

### 3.4 Force push

```bash
git push origin --force --all
git push origin --force --tags
```

### 3.5 Clean up mirror clone

```bash
cd /tmp
rm -rf elora-vault-mirror.git
```

---

## 4. After cleanup — collaborator instructions

**Anyone who had previously cloned the repo MUST re-clone.**

Do NOT `git pull` — the rewritten history shares no common ancestors with
the old history. A pull will produce conflicts or merge garbage.

```bash
# Instead of pulling:
rm -rf elora-vault
git clone https://github.com/sparshsam/elora-vault.git
```

---

## 5. GitHub cache considerations

GitHub caches repository data for performance. After a force-push:

1. **The web UI** may show old commit SHAs for a few minutes. Refresh or
   wait 5-10 minutes.
2. **GitHub API** responses may return cached data. Use `?cache_bust=timestamp`
   if you see stale SHA references in scripts.
3. **GitHub Actions** may reference old commit SHAs in run history. Old runs
   are preserved but the commits they reference will be orphaned (no tree
   reachable from any branch). This is safe — old CI run logs are still
   viewable.
4. **Pull request history** referencing cleaned commits will show those
   commits as "missing" or "not found." Close and re-open PRs to refresh.

### Enabling GitHub secret scanning

GitHub can automatically scan for known secret patterns in push events
and existing history:

1. Go to repository → **Settings** → **Security & analysis**
2. Enable **Secret scanning** (free for public repos)
3. Enable **Push protection** (blocks pushes containing known secrets)
4. Optionally enable **Secret scanning for non-provider patterns** (catches
   custom formats like Supabase URLs)

---

## 6. Vercel redeploy considerations

After force-pushing:

### Auto-deploy behavior
- Vercel auto-deploys when `main` is force-pushed — the new commit SHA
  triggers a fresh deployment.
- If auto-deploy doesn't trigger, manually deploy from the Vercel dashboard:
  Project → Deployments → Trigger Deployment → Deploy `main`

### Environment variables
- Vercel env vars are set in the dashboard (Settings → Environment Variables)
- They are **not** read from `.env.production` or any git-tracked file
- The history cleanup has no effect on Vercel's running environment

### Deploy hooks
- If you use Vercel Deploy Hooks (HTTP endpoints), they trigger on push
  events regardless of SHA changes. No action needed.

### What to verify after redeploy
- [ ] App loads and authenticates
- [ ] Wallet connection works
- [ ] Contract reads return expected values
- [ ] Deposit/protect/release flows work
- [ ] Activity timeline renders correctly

---

## 7. Environment hardening status

### .gitignore (current, comprehensive)

```
.env*.local
.env
.env.production
.env.vercel
vercel-env.txt
force-deploy.txt
```

### .env.example (clean template)

All real values replaced with placeholders:
- `YOUR-PASSWORD`
- `your-project-ref`
- `your-walletconnect-project-id`
- `your-d…-key`
- `your-b…-key`

### NEXT_PUBLIC usage audit

| Variable | Correct? | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Public URL, required by Supabase SSR |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Public key, safe for client-side |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | ✅ | Public project ID, required by RainbowKit |
| `NEXT_PUBLIC_BASE_RPC_URL` | ✅ | Public endpoint |
| `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL` | ✅ | Public endpoint |
| `NEXT_PUBLIC_BASE_BUILDER_CODE` | ✅ | Optional, not wired to production |
| `NEXT_PUBLIC_SITE_URL` | ✅ | URL, not a secret |

No server-only secrets are exposed via `NEXT_PUBLIC_*` variables.

---

## 8. Current source file scan results

| Scan target | Result |
|---|---|
| Hardcoded private keys in src/ | ✅ None found |
| Hardcoded API tokens in src/ | ✅ None found |
| Bearer tokens in src/ | ✅ None found |
| Supabase secrets in src/ | ✅ None found |
| Alchemy/Infura keys in src/ | ✅ None found |
| Wallet credentials in src/ | ✅ None found |
| Secret URLs in docs/ | ✅ None found |
| Hardcoded secrets in scripts/ | ✅ None found |
| Hardcoded secrets in workflows/ | ⚠️ WalletConnect project ID fallback (public — acceptable) |
| Stripe keys (sk_) in any file | ✅ None found |

---

## 9. GitHub security recommendations

### 9.1 Dependabot

✅ Already configured (`.github/dependabot.yml`):
- Weekly npm dependency updates
- Grouped updates for Next.js, Prisma, Supabase, React, Tailwind
- Reviewer: `sparshsam`

**Suggested addition:** Enable version updates for GitHub Actions:

```yaml
- package-ecosystem: "github-actions"
  directory: "/"
  schedule:
    interval: "weekly"
```

### 9.2 Branch protection

Recommended settings for `main`:

| Setting | Recommendation |
|---|---|
| Require pull request before merging | ✅ Yes |
| Require status checks | ✅ Lint + Build |
| Require up-to-date branches | ✅ Yes |
| Include administrators | ✅ Yes (prevents accidental force-push after cleanup) |
| Allow force pushes | ❌ Disable (reenable only during cleanup) |
| Lock branch | Consider during active secret cleanup |

### 9.3 Secret scanning

Recommended settings (Settings → Security & analysis):

| Feature | Enable? |
|---|---|
| Secret scanning | ✅ Yes (catches standard provider patterns) |
| Push protection | ✅ Yes (blocks new commits with secrets) |
| Non-provider patterns | ✅ Yes (catches custom patterns, Supabase URLs) |

### 9.4 Pre-commit hook (prevent future leaks)

```bash
# .githooks/pre-commit
#!/bin/bash
echo "🔍 Checking for .env files in commit..."
if git diff --cached --name-only | grep -E '\.env\.(production|vercel|staging)$'; then
  echo "❌ ERROR: .env.production/.env.vercel files must not be committed."
  exit 1
fi

# Check for suspected private keys
if git diff --cached -U0 | grep -E '^\+.*[0-9a-f]{64}' | grep -v 'test\|mock\|placeholder'; then
  echo "⚠️  WARNING: Possible private key in commit. Verify before pushing."
fi
```

Install it:

```bash
chmod +x .githooks/pre-commit
git config core.hooksPath .githooks
```

---

## 10. Final verification checklist

- [ ] All exposed secrets rotated (deployer key, Alchemy, Supabase, Vercel OIDC)
- [ ] `git filter-repo` executed on a fresh clone
- [ ] `.env.production`, `.env.vercel`, `vercel-env.txt` confirmed absent from history
- [ ] Force-push completed successfully
- [ ] Vercel redeploy verified
- [ ] Collaborators notified to re-clone
- [ ] GitHub secret scanning enabled
- [ ] Branch protection re-enabled after force-push
- [ ] Pre-commit hook installed
