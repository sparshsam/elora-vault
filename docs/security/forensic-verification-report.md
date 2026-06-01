# Forensic Verification Report

> **Phase:** 6.6 — Repository Stabilization & Security Completion
> **Date:** 2026-06-01
> **Commit inspected:** 296b289

---

## 1. Repository History Verification

### Files targeted for removal

| File | Status | Notes |
|---|---|---|
| `.env.production` | ✅ Eradicated | 0 commits remaining |
| `.env.vercel` | ✅ Eradicated | 0 commits remaining |
| `vercel-env.txt` | ✅ Eradicated | 0 commits remaining |
| `SECURITY_NOTES.md` | ✅ Eradicated | 0 commits remaining |

### Files NOT targeted — still contain secrets

| File | Remaining commits | Contents |
|---|---|---|
| `api/place-bet.js` | ⚠️ 11 commits | Hardcoded deployer private key, Alchemy API key, Polygon Amoy RPC URL |

**`api/place-bet.js`** was an early prototype script from July 2025 (before
the Elora Vault restructure). It hardcodes:

```javascript
const PRIVATE_KEY = "&lt;redacted&gt;";
const provider = new ethers.providers.JsonRpcProvider("https://polygon-amoy.g.alchemy.com/v2/&lt;redacted&gt;");
```

This file is NOT in the current HEAD (deleted in a later commit), but
remains in 11 historical commits spanning Jul 2025 – May 2026.

**Action required:** Run `git filter-repo` with `--path api/place-bet.js --invert-paths`
to remove this from all history. See `docs/security/git-history-cleanup.md`
for procedure.

### Reachable refs scanned

| Ref type | Count | Secrets found? |
|---|---|---|
| Branches | 1 (`main`) | ✅ Clean |
| Tags | 0 | — |
| Remote refs | 2 (origin/HEAD, origin/main) | ✅ Clean |
| Orphaned refs | 0 | — |

### Other deleted files from old history

`.agents/` directory (agent skill documentation) — contains no secrets.
Safe.

---

## 2. Source Code Secret Scan

| Pattern | `src/` | `docs/` | `scripts/` | `contracts/` |
|---|---|---|---|---|
| Private keys (64-char hex) | ✅ None | ✅ None | ✅ None | ✅ None |
| API tokens / bearer tokens | ✅ None | ✅ None | ✅ None | ✅ None |
| Supabase URLs (outside .env.example) | ✅ None | ✅ None | ✅ None | ✅ None |
| Alchemy / Infura keys | ✅ None | ✅ None | ✅ None | ✅ None |
| Wallet credentials | ✅ None | ✅ None | ✅ None | ✅ None |
| Stripe keys (sk_) | ✅ None | ✅ None | ✅ None | ✅ None |
| Vercel OIDC tokens | ✅ None | ✅ None | ✅ None | ✅ None |

**Current source is clean.** No hardcoded secrets in any production code.

---

## 3. CI/CD Artifact Review

| Artifact | Status | Notes |
|---|---|---|
| GitHub Actions logs | ✅ Clean | Placeholder env vars only (WalletConnect public ID, placeholder URLs) |
| Action workflow files | ✅ Clean | `secrets.*` references, safe fallbacks |
| Build output | ✅ Clean | Environment info — no secrets |
| Cached npm packages | ✅ Clean | Public package tarballs only |
| Vercel previews | ⚠️ Not reviewed | Requires Vercel dashboard access |

### CI workflow findings

The CI workflow (`ci.yml`) passes env vars with safe fallbacks:
- Database URLs use placeholder values
- Supabase keys use placeholder values
- WalletConnect uses a public project ID as fallback (acceptable)
- No real secrets in YAML

---

## 4. Production Environment Audit

The following require dashboard access (not available from the repo):

| Environment | What to check | Current likely status |
|---|---|---|
| **Vercel env vars** | Are old secrets (private key, Alchemy key, DB password) still set? | ⚠️ May still be configured — dashboard review needed |
| **Supabase** | Has DB password been rotated since exposure? | ⚠️ Should be rotated |
| **Alchemy** | Was API key rotated? | ⚠️ Should be rotated |
| **GitHub Secrets** | Are old credentials in Actions secrets? | ⚠️ May still be configured |

---

## 5. Deployer Wallet Assessment

The deployer private key `0xe599...2f11` appears in:

| Location | Status |
|---|---|
| `.env.production` (historical) | ✅ Removed from history |
| `.env.vercel` (historical) | ✅ Removed from history |
| `api/place-bet.js` (historical) | ⚠️ Still in 11 old commits |
| Current `src/` | ✅ Not referenced |
| Vercel env vars | ⚠️ May still be configured |
| Foundry deploy configs | ✅ Not referencing this key |

The key was deployed on **Polygon Amoy** (testnet), not Base. The
contract address `0xC866f7F09534D8632f5F8075175b69427F6e25c4` was
used with this deployer, but this is a testnet deployment on a
different chain (Polygon Amoy) from Elora's current deployment
(Base Sepolia).

**Risk assessment:** Lower for mainnet funds, but the key should
still be considered compromised and rotated.

---

## 6. Operational Security Status

| Criterion | Status | Action needed |
|---|---|---|
| Git history clean of `.env.*` files | ✅ Complete | — |
| Git history clean of `place-bet.js` | ❌ Missed | Run filter-repo on `api/place-bet.js` |
| All source code secret-free | ✅ Verified | — |
| Deployer key rotated | ❌ Not verified | Dashboard check needed |
| Supabase credentials rotated | ❌ Not verified | Dashboard check needed |
| Alchemy key rotated | ❌ Not verified | Dashboard check needed |
| Vercel secrets reviewed | ❌ Not verified | Dashboard check needed |
| Collaborators notified | ⚠️ Single-contributor project | No action unless new contributors added |
| Pre-commit hook installed | ✅ Created | Run `git config core.hooksPath .githooks` |

---

## 7. Residual Exposure Assessment

**Severity:** 🟠 Medium

**Why not critical:** The `api/place-bet.js` secrets are in old history on
a testnet chain (Polygon Amoy), not on Base where Elora's current
contracts live. The deployer key on Amoy has no authority over
Base Sepolia or Base Mainnet contracts.

**Why not clean:** The private key and Alchemy key are still extractable
from git history. Anyone cloning the repo can find them.

**Fix:** One additional `git filter-repo --path api/place-bet.js --invert-paths`
pass will complete the eradication.
