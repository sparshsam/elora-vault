# Git History Cleanup Guide

Date: 2026-06-01

## Scope

The repository history was rewritten to remove secret-bearing files from all commits.

Removed paths:

- `.env.production`
- `.env.vercel`
- `vercel-env.txt`
- `SECURITY_NOTES.md`

## Tooling

Cleanup used `git-filter-repo`:

```bash
python -m git_filter_repo --force \
  --path .env.production \
  --path .env.vercel \
  --path vercel-env.txt \
  --path SECURITY_NOTES.md \
  --invert-paths
```

## Rollback

A local-only bundle backup was created before rewriting history:

```text
C:\Users\spars\Documents\Codex\2026-05-31\can-you-see-my-elora-vault\backups\elora-vault-pre-secret-purge.bundle
```

Restore into a separate directory:

```powershell
cd C:\Users\spars\Documents\Codex\2026-05-31\can-you-see-my-elora-vault
git clone .\backups\elora-vault-pre-secret-purge.bundle elora-vault-rollback
cd elora-vault-rollback
git remote add origin https://github.com/sparshsam/elora-vault.git
```

Only if a rollback is explicitly required:

```powershell
git push --force-with-lease origin main
```

Do not push backup branches or bundles to GitHub. They contain the old contaminated history.

## Verification

Run from a fresh clone:

```bash
git log --all --full-history --name-only --pretty=format: -- .env.production .env.vercel vercel-env.txt SECURITY_NOTES.md .env
git grep -n -I -E '(PRIVATE_KEY=|SUPABASE_SERVICE_ROLE_KEY=|DATABASE_URL=postgresql://|DIRECT_URL=postgresql://|VERCEL_OIDC_TOKEN=|ALCHEMY_RPC_URL=.*alchemy\.com/v2/)' -- ':!package-lock.json'
```

Expected result: no secret-bearing files in history and no committed secret values.

## Aftercare

- Rotate every exposed credential with its provider.
- Re-clone local working copies after the rewritten history lands.
- Reconfigure local hooks:

```bash
git config core.hooksPath .githooks
```

- Keep real environment values only in provider secret stores.
