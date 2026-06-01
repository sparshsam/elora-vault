# GitHub Security Configuration — Elora Vault

> **Phase:** 6.4F — Repository Secret Eradication
> **Purpose:** Recommended GitHub security settings for production readiness

---

## 1. Secret Scanning

GitHub's built-in secret scanning detects known credential patterns on push
and in existing repository history. For a public repository that has
previously contained secrets, this is essential.

### To enable:

1. Navigate to repository → **Settings** → **Security & analysis**
2. Under "Secret scanning":
   - ✅ **Secret scanning** — Detect known secret patterns
   - ✅ **Push protection** — Block commits containing known secrets
   - ✅ **Non-provider patterns** — Detect custom patterns (Supabase URLs,
     custom API keys, etc.)

### Current state

The repository is public. GitHub free secret scanning is available and
should be enabled.

### What it catches

GitHub secret scanning automatically detects patterns for:
- Alchemy API keys ✓
- Ethereum/Bitcoin private keys ✓
- Supabase service tokens ✓
- WalletConnect project IDs ✓
- 200+ other provider patterns

---

## 2. Dependabot

### Current configuration (`.github/dependabot.yml`)

✅ Weekly npm dependency updates
✅ Grouped updates (Next.js, Prisma, Supabase, React, Tailwind)
✅ PR reviewer set to `sparshsam`
✅ 10 open PR limit

### Recommended addition: GitHub Actions updates

Add a second ecosystem entry:

```yaml
- package-ecosystem: "github-actions"
  directory: "/"
  schedule:
    interval: "weekly"
    day: "monday"
    time: "09:00"
    timezone: "America/New_York"
  open-pull-requests-limit: 5
  labels:
    - "dependencies"
    - "automated"
  commit-message:
    prefix: "chore(deps)"
```

---

## 3. Branch Protection Rules

### How to configure

1. Repository → **Settings** → **Branches** → **Add rule**
2. Branch name pattern: `main`

### Recommended settings

| Setting | Value | Rationale |
|---|---|---|
| **Require pull request before merging** | ✅ | Prevents direct pushes to main |
| Require approvals | 1 | Single-reviewer project |
| Dismiss stale reviews | ✅ | Ensures latest code is reviewed |
| **Require status checks** | ✅ | Enforces CI quality gates |
| Require branches up to date | ✅ | Prevents stale-base merges |
| Status checks to require | `Lint & TypeScript`, `Build` | Defined in CI workflow |
| **Require conversation resolution** | ✅ | Ensures all comments addressed |
| **Include administrators** | ✅ | No exceptions for admin pushes |
| **Allow force pushes** | ❌ Disable | Prevents accidental history rewrites |
| **Allow deletions** | ❌ Disable | Prevents accidental branch deletion |
| Lock branch | Optional | Use during active secret cleanup |

### During force-push cleanup

Temporarily:
1. **Allow force pushes** → ✅ Enable (set to "Everyone" or specific users)
2. **Include administrators** → ❌ Disable temporarily

After cleanup completes:
1. Revert both settings to the recommended values above.

---

## 4. Pre-commit Hook

A git pre-commit hook prevents accidental secret commits before they
reach the remote. This is a local developer safeguard.

### File: `.githooks/pre-commit`

```bash
#!/bin/bash
set -e

echo "🔍 Checking staged files for secrets..."

# Block .env files that should never be committed
ENV_BLOCKLIST="\.env\.(production|vercel|staging)$"
if git diff --cached --name-only | grep -qE "$ENV_BLOCKLIST"; then
  echo "❌ ERROR: Blocked files in commit:"
  git diff --cached --name-only | grep -E "$ENV_BLOCKLIST"
  echo ""
  echo "These files contain sensitive credentials and must not be committed."
  echo "Remove them from staging with: git restore --staged <file>"
  exit 1
fi

# Warn about potential private keys (64-char hex strings)
if git diff --cached -U0 | grep -E '^\+.*[0-9a-f]{64}' | grep -vE '(test|mock|placeholder|0x[a-f0-9]{40})' > /dev/null 2>&1; then
  echo "⚠️  WARNING: Possible private key detected in diff."
  echo "   Review before pushing:"
  git diff --cached -U0 | grep -E '^\+.*[0-9a-f]{64}' | head -5
  echo ""
fi

echo "✅ Pre-commit checks passed"
```

### Installation

```bash
chmod +x .githooks/pre-commit
git config core.hooksPath .githooks
```

---

## 5. GitHub Actions Security

### Secrets management

Current CI workflow uses `secrets.*` for all sensitive values. This is correct.

**Best practices:**
- ✅ All database URLs, API keys, and tokens are stored as GitHub secrets
- ✅ All secrets have safe fallback values for local/PR builds
- ⚠️ The WalletConnect fallback in CI is a public ID — acceptable

### Workflow permissions

1. Repository → **Settings** → **Actions** → **General**
2. Workflow permissions → **Read repository contents** (least privilege)
3. Disable "Allow GitHub Actions to create and approve PRs" unless needed

---

## 6. Post-cleanup verification

After executing the git filter-repo workflow:

- [ ] Secret scanning enabled and actively monitoring
- [ ] Push protection enabled
- [ ] Branch protection restored (force-push disabled)
- [ ] Dependabot configured for GitHub Actions
- [ ] Pre-commit hook documented and installable
- [ ] No `.env.*` files tracked in HEAD
- [ ] No secret patterns found in current source scan
