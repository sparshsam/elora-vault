# Secret Remediation Report

Date: 2026-06-01

## Objective

Eliminate historical and operational secret exposure risk from the Elora Vault repository and deployment pipeline.

## Completed

- Rewrote git history with `git-filter-repo`.
- Removed these paths from every commit:
  - `.env.production`
  - `.env.vercel`
  - `vercel-env.txt`
  - `SECURITY_NOTES.md`
- Added local runtime normalization:
  - `.nvmrc`
  - `.node-version`
  - `packageManager`
- Hardened CI by running lint, typecheck, and build on Node 22 with placeholder-only environment values.
- Added a repository pre-commit hook at `.githooks/pre-commit`.
- Enabled GitHub security automation where repository permissions allowed.

## Rotation Checklist

Rotate and verify the following outside git:

- Deployer private key: generate a new deployer wallet, move any ownership/allowances if applicable, and verify the old key cannot deploy or operate privileged actions.
- Supabase database password: reset the database password, update Vercel/GitHub secrets, and verify old connection strings fail.
- Supabase service role key: rotate JWT secret or project API keys from Supabase dashboard as available, update deployment secrets, and verify the old service key fails.
- Alchemy API keys: revoke the exposed key, create a replacement, update deployment secrets, and verify old RPC requests fail.
- WalletConnect project ID: rotate if desired; this is public client configuration but should still be normalized.
- Vercel tokens: revoke exposed user/team/deploy tokens and verify old tokens cannot access project APIs.

## Cleaned-History Verification

Run these commands after cloning fresh:

```bash
git log --all --full-history --name-only --pretty=format: -- .env.production .env.vercel vercel-env.txt SECURITY_NOTES.md .env
git grep -n -I -E '(PRIVATE_KEY=|SUPABASE_SERVICE_ROLE_KEY=|DATABASE_URL=postgresql://|DIRECT_URL=postgresql://|VERCEL_OIDC_TOKEN=|ALCHEMY_RPC_URL=.*alchemy\.com/v2/)' -- ':!package-lock.json'
```

Expected result: no secret-bearing files in history and no committed secret values.

## Repo Hygiene Checklist

- Keep real env values only in Vercel, GitHub Actions secrets, Supabase, and provider dashboards.
- Do not commit local incident notes containing raw secrets.
- Keep `.env.example` placeholder-only.
- Keep GitHub secret scanning and push protection enabled.
- Keep Dependabot security updates enabled.
- Use `.githooks/pre-commit` locally:

```bash
git config core.hooksPath .githooks
```

## Remaining Risks

- History rewriting cannot remove secrets from existing forks, local clones, caches, screenshots, terminal logs, or provider audit logs.
- Exposed credentials must be rotated with each provider before the incident is fully closed.
- GitHub Advanced Security features may require repository or billing-level support for full secret scanning coverage on public/private scopes.
