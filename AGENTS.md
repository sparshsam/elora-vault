<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Context

**Canonical single source of truth for Elora Vault project context is `CLAUDE.md` in this directory.** Read it before making any changes. For architectural context (system boundaries, ownership map, invariants), also read `ARCHITECTURE.md`. It contains:
- Layer maturity table (what's safe to rely on)
- Complete file map by layer
- Capital state model and architecture
- All 27 routes
- Policy Runtime v1 architecture + invariants
- Recently completed work (don't redo)
- Remaining items (know the roadmap)
- Design constraints and CI status

## Product Boundaries (Mandatory)

1. **Elora is infrastructure.** Do not build consumer UX, marketing pages, or onboarding flows here. Those belong in Canopy.
2. **Layer separation.** Elora is the behavioral capital OS. Canopy is the consumer interface.
3. **Mock data is temporary.** Design for real contract integration.
4. **Onchain settlement.** All vault mechanics and policy execution happen onchain.

## Branch Naming

- \`feat/*\` — New features
- \`fix/*\` — Bug fixes
- \`docs/*\` — Documentation changes
- \`refactor/*\` — Code restructuring
- \`chore/*\` — Maintenance tasks

## Workflow

1. Always branch from \`main\`.
2. Run validation before every PR.
3. Open a PR for every merge into \`main\`.
4. No direct pushes to \`main\`.

## Ecosystem Standards

All ecosystem repos follow: https://github.com/sparshsam/ecosystem-standards
