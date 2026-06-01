# Security Rotation Checklist

> **Phase:** 6.6 — Repository Stabilization & Security Completion
> **Status:** ⚠️ Operational — requires dashboard access to complete

---

## Instructions

1. Work through each item below in order
2. Check off each item after verifying the credential is rotated
3. Confirm the old credential no longer works after rotation
4. DO NOT document the new values in git

---

## Step 1: Deployer Private Key

**Old key hash:** `0xe599...f11` (appears in `api/place-bet.js` historical + old `.env` files)

- [ ] Generate a new Ethereum wallet for Base deployments
- [ ] If the old key has any onchain authority, transfer ownership before abandonment
  - Old contract: `0xC866f7F09534D8632f5F8075175b69427F6e25c4` (Polygon Amoy — testnet, likely no action needed)
- [ ] Update Foundry deploy config to use the new key
- [ ] Verify old key is no longer stored in:
  - [ ] Vercel dashboard env vars
  - [ ] GitHub Actions secrets
  - [ ] Local `.env` files
  - [ ] Any deployment scripts
- [ ] Confirm old key cannot deploy or call privileged functions

---

## Step 2: Supabase Database Password

**Old password:** `&lt;redacted&gt;*` (appears in `.env.vercel` history)

- [ ] Log into Supabase dashboard → Database → Settings → Reset database password
- [ ] Update connection string in:
  - [ ] Vercel environment variables (`DATABASE_URL`, `DIRECT_URL`)
  - [ ] GitHub Actions secrets
  - [ ] Local `.env` files
- [ ] Verify old connection string no longer works (connection rejection = success)

### Supabase Service Role Key

- [ ] Rotate service role key in Supabase dashboard (Settings → API)
- [ ] Update `SUPABASE_SERVICE_ROLE_KEY` in:
  - [ ] Vercel env vars
  - [ ] GitHub Actions secrets

---

## Step 3: Alchemy API Key

**Old key:** Starts with `mJeNa...` (appears in `.env.production` + `api/place-bet.js` history)

- [ ] Alchemy Dashboard → Apps → Rotate API Key
- [ ] Note: This key was for **Polygon Amoy** (testnet), not Base. If separate
      from production keys, rotation is lower urgency but still recommended.
- [ ] If any current RPC endpoints use this key, update them

---

## Step 4: Vercel OIDC Token

**Old token:** JWT starting with `eyJhbG...` (appears in `.env.production` + `.env.vercel` history)

- [ ] Vercel Dashboard → Settings → OIDC → Rotate token
- [ ] This token is used for Vercel-to-cloud-provider trust. If no
      downstream service uses Vercel OIDC, no rotation is needed.

---

## Step 5: Git History — Remaining File

- [ ] Run `git filter-repo --path api/place-bet.js --invert-paths` to remove
      the remaining secret-bearing file from history
- [ ] Force-push the cleaned history
- [ ] Verify no remaining references: `git log --all --full-history -- api/place-bet.js`
      should return 0 commits

---

## Step 6: Verify Rotations

- [ ] Clone a fresh copy of the repo after history cleanup
- [ ] Confirm `.env.example` is the only env file in history
- [ ] Confirm `api/place-bet.js` is absent from all commits
- [ ] Verify Vercel deployment still works with new credentials
- [ ] Verify CI passes with new GitHub secrets
- [ ] Verify database connection with new password
- [ ] Confirm old credentials are rejected

---

## Step 7: Lock Down

- [ ] Enable GitHub secret scanning (Settings → Security & analysis)
- [ ] Enable push protection (blocks commits with known secrets)
- [ ] Install pre-commit hook: `git config core.hooksPath .githooks`
- [ ] Verify `.gitignore` covers all env files:
  - `.env` ✅
  - `.env*.local` ✅
  - `.env.production` ✅
  - `.env.vercel` ✅
  - `vercel-env.txt` ✅
  - `force-deploy.txt` ✅
- [ ] Verify no `.env.*` files exist in the working tree

---

## Remaining Risk Assessment

| Risk | Likelihood | Impact | After rotation |
|---|---|---|---|
| Deployer key used for unauthorized deployment | Low (testnet only) | Low | ✅ Eliminated |
| Supabase DB access via leaked password | Low | High (data exposure) | ✅ Eliminated |
| Alchemy RPC abuse | Low | Low (testnet) | ✅ Eliminated |
| Vercel OIDC impersonation | Low | Medium | ✅ Eliminated |
| place-bet.js secrets from old history | Medium | Low (testnet, different chain) | ✅ Eliminated after filter-repo |
