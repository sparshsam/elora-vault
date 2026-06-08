# Elora Vault v1.0 Freeze — Behavioral Protection Core

## Core Concept
Elora Vault is a **self-custodied behavioral capital vault** on Base. NOT a sportsbook, casino, or gambling protocol.

### Philosophy
- "Protect your capital from yourself."
- "Not every dollar should feel equally available."
- "Quiet by default. Present when needed. Invisible when not."

---

## Elora v1.0 Freeze Mission Plan

Elora is approaching a hard feature-freeze wall. The goal is no longer to add major systems. The goal is to make the current Behavioral OS loop **stable, coherent, calm, secure, and polished** before real users.

### The Behavioral OS Loop
```
Capital State
→ Policy Runtime
→ Intent Suggestions
→ User Confirmation
→ Transaction Execution
→ Activity Memory
→ Future Policy Evaluation
```

### v1.0 Included
- Core capital system
- Available / Protected / Releasing / Committed capital states
- Canonical capital engine (capital-state.ts)
- Timed protection horizons (VaultLock model + onchain locks)
- Release and re-protection flows
- Behavioral OS loop (capital → policy → intent → confirm → execute → remember → re-evaluate)
- Policy Studio MVP (CRUD + state-based evaluator)
- Policy Runtime suggestions-only evaluator (no auto-execution)
- Intent decision cockpit (/intent page with release confirmations + protection prompts)
- Activity memory / event ledger (/activity page + API)
- Transaction lifecycle hardening (tx-hooks, confirmations, error states)
- Wallet timeout recovery
- Wrong-network handling
- Builder Code production wiring (meta tags, env vars, utility functions)
- Supabase RLS / security hardening
- Base capability detection (isolated lab, not production wallet flow)
- EOA-safe fallback architecture
- Calm, restrained, non-DeFi, non-gamified UX philosophy

### Explicitly Not v1
Out of scope before real users validate the current loop:
- Automatic policy execution
- Autonomous capital movement
- Paymasters
- Gas sponsorship
- Production batching
- Sub-account routing
- Full Base Account migration (from lab to production wallet flow)
- Productive protection / yield integrations
- AI capital management
- Advanced analytics
- Social features
- Mobile app (native)
- Push notifications
- Collaborative systems
- Vault composability
- Any feature that increases architectural complexity without user validation

### Allowed Work During Freeze
- UX polish
- Copy / microcopy polish
- Empty state improvements
- Onboarding clarity
- Mobile responsiveness
- Accessibility
- Performance
- Transaction reliability
- State consistency
- Bug fixes
- Security hardening
- Simplification
- Reducing architecture exposure from normal UI (tuck labs/research away)
- Settings / Labs separation
- Documentation updates
- Test coverage if applicable

### Forbidden Work During Freeze
Unless explicitly approved by Sparsh:
- New major architectural layers
- Auto-execution of any kind
- New financial primitives
- Production smart-wallet orchestration
- Yield integrations
- Paymaster integrations
- Hidden automation
- Schema-heavy redesigns
- Major routing changes
- Gamification
- DeFi dashboard features
- Sportsbook-like language
- AI systems that can move capital

### Definition of v1.0 Done
Elora v1.0 is ready to stop building major features when:
- Capital states are stable (no flickering, triple-source resolved)
- Activity is trustworthy (complete, accurate, no gaps)
- Intent is coherent (clear options, calm framing, no noise)
- Policy Runtime works safely (no false positives, sensible suggestions)
- All policy suggestions require confirmation (`requiresConfirmation: true` invariant)
- Transaction UX is resilient (timeout recovery, error messages, retry guidance)
- RLS / security posture is hardened (no exposed service-role keys)
- Builder Code infrastructure is stable (env var, meta tags, utility all wired)
- Base capability detection is isolated (lab only, not leaking into production wallets)
- Onboarding is understandable (new user can deposit, protect, predict in < 5 min)
- Mobile UX is reliable (touch targets, responsive, no layout breakage)
- Settings is no longer a technical dumping ground (clean separation of concerns)
- Labs / Research are clearly separated from production surfaces
- The product feels calm, restrained, and coherent end-to-end

---

## Layer Maturity (Single Source of Truth)

This table defines what's safe to rely on vs what's architecture-only:

| Layer | Status | Meaning |
|---|---|---|
| Vault mechanics | **Production-built** | ProtectedVault contract verified on Base Sepolia. wagmi hooks, tx hooks, vault UI all live. |
| Behavioral separation | **Production-built** | Capital state model (available/protected/releasing/committed), Zustand store, wallet–vault boundary all wired. |
| Prediction routing | **Production-built** | Sessions page, modal, API route, and at_risk_balance tracking live. |
| Intent/release flows | **Production-built** | Intent page, release-windows.ts (5 types), release confirmation UI live. |
| Policy engine | **Foundation-built** | Types, engine, components, CRUD APIs, state-based runtime evaluator, /api/policies/evaluate endpoint, Intent page integration — produces structured suggestions with requiresConfirmation: true. Execution wiring remains future. |
| Base-native infra | **Foundation-built** | EIP-5792 capability detection, account architecture files, Base Account Lab page — SDK wrapper exists but no production wallet flow replacement. |
| Builder attribution | **Infrastructure-built** | builder-code.ts utility done, env var set in Vercel, meta tag in layout, dataSuffix wired into production write hooks with no-op fallback when unset. |
| Productive protection | **Research-built** | Conceptual protection modes defined, yield strategy research done, research page — no protocol integrations or execution logic. |
| Delayed liquidity | **UX/model-built** | Interactive mock UX flows in delayed-release-mocks.tsx, previews on Intent page — not wired to onchain release logic. |

## Capital State Model
```
totalEloraCapital = available + protected + releasing + committed
```

| State | Source | Meaning |
|---|---|---|
| Connected Wallet | useUSDCBalance() | External USDC in connected wallet (outside Elora) |
| Available | derived from contract + wallet | Capital ready to use inside Elora |
| Protected | vaultSummary.totalLocked | Capital in active horizons |
| Releasing | vault unlocked balance | Protected capital returning to availability |
| Committed | walletStore.at_risk_balance | Capital in active predictions |

## Architecture

### Onchain (Smart Contracts)
- **ProtectedVault** (`contracts/src/ProtectedVault.sol`) — Base Sepolia
- Address: `0x7876A2fa21BAfD40F7b61F49390d0FED556Db1fd`
- USDC (Base Sepolia): `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- VERIFIED on BaseScan
- Base.dev verification: base:app_id meta tag in root layout

### Frontend
- Next.js 16 App Router, TypeScript, TailwindCSS v4
- wagmi + viem + RainbowKit for wallet connection
- `@base-org/account` SDK installed (isolated lab only, not production)
- Zustand for client state

### Backend
- Supabase + PostgreSQL via Prisma
- Backend tracks: wallet state, predictions, vault locks, transactions, sessions, policies

## Complete Route Tree (29 routes)

### Pages (authenticated)
```
○ /vault                     — Capital state home (wallet strip + 4 capital cards)
○ /activity                  — Transaction timeline
○ /intent                    — Release confirmations + protection opportunities + policy runtime suggestions + delayed release previews
○ /policies                  — Behavioral protection policy engine
○ /sessions                  — Prediction logging + settlement
○ /research                  — Research-only productive protection concepts
○ /settings                  — Account, wallet, preferences, policy summary, outward links
○ /settings/base-account-lab — Base Account prototype (hidden lab)
○ /settings/labs             — Consolidated lab navigation
○ /settings/productive-protection — Redirects to /research
```

### Pages (unauthenticated)
```
○ /            — Landing
○ /auth/login  — Login
○ /auth/signup — Signup
○ /dashboard   — Redirects to /vault
```

### API Routes
```
ƒ /api/bets                       — Prediction CRUD
ƒ /api/bets/[id]/settle           — Prediction settlement
ƒ /api/bets/[id]/protect          — Post-win protection
ƒ /api/onchain/event              — Onchain event ingestion
ƒ /api/policies                   — Policy CRUD
ƒ /api/policies/[id]              — Policy update/delete
ƒ /api/policies/activity          — Policy lifecycle events
ƒ /api/policies/evaluate          — Policy Runtime v1 evaluation (state-based)
ƒ /api/sessions                   — Session persistence
ƒ /api/vault/locks                — Vault lock queries
ƒ /api/vault/locks/[id]           — Individual lock
ƒ /api/wallet                     — Wallet state + deposit
ƒ /api/wallet/connect             — Wallet connection
ƒ /api/wallet/transactions        — Transaction history
ƒ /auth/callback                  — Supabase auth callback
```

## Complete File Map by Layer

### Layout & Navigation
- `src/app/layout.tsx` — Root layout (base:app_id meta tag, Builder Code env)
- `src/app/(authenticated)/layout.tsx` — TopHeader + PageFooter + MobileNav + Web3Provider
- `src/components/layout/top-header.tsx` — Desktop top nav
- `src/components/layout/page-shell.tsx` — Page wrapper
- `src/middleware.ts` — Auth protection

### Capital System
- `src/lib/capital-state.ts` — Re-export from canonical module
- `src/lib/capital/capital-state.ts` — Canonical capital state model + hooks (useCapitalState)
- `src/lib/capital/release-windows.ts` — 5 release window types (immediate, delayed, scheduled, staged, reviewed)
- `src/lib/web3/hooks.ts` — Read hooks (useVaultSummary, useVaultLocks)
- `src/lib/web3/tx-hooks.ts` — Write hooks (deposit, protect, release, withdraw)
- `src/lib/web3/config.ts` — wagmi + RainbowKit config
- `src/lib/web3/providers.tsx` — Web3 provider wrapper
- `src/store/useWalletStore.ts` — Zustand store

### Policy System (6 files, 4 API routes)
**Types:**
- `src/types/policy.ts` — ProtectionPolicy, PolicyCondition, PolicyAction, PolicyStatus, POLICY_TYPE_META
- `src/types/policy-orchestration.ts` — EvaluationContext, EventEvaluationResult, PolicySuggestion, PolicyRuntimeSuggestion, RuntimeEvaluationInput, ReflectionState, TimelineEntry, PolicySchedule

**Engine:**
- `src/lib/policies/policy-engine.ts` — validatePolicy(), normalizePolicyRequest(), status transitions
- `src/lib/policies/policy-evaluator.ts` — Event-driven evaluation (evaluatePolicies, evaluateSinglePolicy, condition checkers)
- `src/lib/policies/policy-runtime-evaluator.ts` — State-based evaluation (evaluatePoliciesForState, per-type checkers, 30-min cooldown)
- `src/lib/policies/policy-state-machine.ts` — Lifecycle state machine, schedule/cooldown management
- `src/lib/policies/policy-suggestions.ts` — Client-side generic suggestion engine + localStorage activity tracking
- `src/lib/policies/policy-timeline.ts` — In-memory timeline store
- `src/lib/policies/events.ts` — CapitalEvent types (8 event types)

**API routes:**
- `src/app/api/policies/route.ts` — GET list, POST create
- `src/app/api/policies/[id]/route.ts` — PATCH update, DELETE
- `src/app/api/policies/activity/route.ts` — Policy lifecycle events for Activity page
- `src/app/api/policies/evaluate/route.ts` — GET: state-based evaluation, returns PolicyRuntimeSuggestion[]

**Components:**
- `src/components/policies/summary-card.tsx` — Metric card
- `src/components/policies/policy-card.tsx` — Policy display + status menu + delete
- `src/components/policies/create-policy-modal.tsx` — 3-step creation form

### Account / Capability Architecture (Phase 5.2B)
- `src/hooks/use-wallet-capabilities.ts` — EIP-5792 capability detection
- `src/components/account/account-capability-panel.tsx` — Infrastructure diagnostics panel
- `src/lib/account/account-strategy.ts` — Strategy types
- `src/lib/account/base-account-client.ts` — Isolated Base Account SDK wrapper
- `src/lib/account/transaction-modes.ts` — Research execution modes
- `src/lib/account/builder-code.ts` — Builder Code utility (getBuilderDataSuffix, hasBuilderCode)

### Yield / Protection Architecture (Phase 6.1B — research only)
- `src/types/productive-protection.ts` — Conceptual protection modes
- `src/lib/yield/yield-strategies.ts` — Research strategy definitions
- `src/components/capital/delayed-release-mocks.tsx` — Interactive mock UX flows

### Shared Components
- `src/components/vault/vault-state-card.tsx` — Premium capital card
- `src/components/capital/capital-operations.tsx` — Deposit/Withdraw/Protect modals
- `src/components/capital/session-modal.tsx` — End Session modal
- `src/components/wallet/wallet-control.tsx` — Connect/disconnect/network control

### Backend
- `prisma/schema.prisma` — Models: User, Wallet, Bet, Transaction, VaultLock, Session, Policy
- `src/lib/prisma.ts` — Prisma client singleton
- `src/lib/supabase/server.ts` — Supabase server client (for auth in API routes)

## Policy Runtime v1 — Architecture Detail

### Two evaluation modes

| Mode | Module | When | Trigger |
|---|---|---|---|
| State-based | policy-runtime-evaluator.ts | Page load / manual refresh | GET /api/policies/evaluate |
| Event-driven | policy-evaluator.ts | On capital events (future wiring) | Called from event handlers |

### State-based evaluation logic

| Policy Type | State Check | Produces |
|---|---|---|
| protect-profit-percentage | Recent won predictions with profits in available capital | protection-prompt with amount |
| prediction-profit-protection | Same, framed as timed horizon | protection-prompt with amount |
| release-reflection-required | Capital releasing or frequent releases detected | reflection-prompt |
| delayed-withdrawal | **Skipped** — event-activated, not state-evaluable | — |
| large-transfer-cooling | **Skipped** — event-activated, not state-evaluable | — |

### Design invariants (enforced at the type level)
- `requiresConfirmation` is always `true` — **do not change this**
- No transaction execution
- No automatic locking, releasing, withdrawing, or protecting
- All suggestions expire after 1 hour

### Cooldown
- 30-minute in-memory cooldown per policy (session lifetime)
- Pass `?skipCooldown=true` to bypass

## Design Tokens
- Warm stone surfaces (`#fafaf8`)
- Botanical green accents (`#4d8537`)
- Restrained amber for releasing/committed states
- Soft borders, no pills, no decorative icons on capital cards

## Deployment
- **Frontend**: `npx vercel --prod` → https://elora-bet-api.vercel.app
- **Database**: `npx prisma db push --accept-data-loss`
- **Contracts**: Foundry → Base Sepolia

## Binding Design Constraints
1. No backend rewrites — UI wraps existing flows
2. No dashboard density — information goes down, not up
3. Restraint = sophistication — remove one thing before shipping
4. Intent is the signature experience
5. No charts, graphs, ROI, APY, PnL, or gamification
6. All policy suggestions require explicit user confirmation — no auto-execution

## Recently Completed (so no one redoes this)

### Policy Runtime v1 (2026-06-02)
- policy-runtime-evaluator.ts (state-based evaluation engine)
- /api/policies/evaluate API endpoint
- PolicyRuntimeSuggestion + RuntimeEvaluationInput types
- Intent page fetches and displays policy-based suggestions

### Before (2026-06-01)
- Phase 6.1B — Delayed release & productive protection architecture
- Phase 5.2B — Base-native capability architecture
- Phase 5.2A — Builder Code + Base.dev verification
- Phase 5.1 — Base Account Lab prototype
- Phase 6.1A — Behavioral protection policy engine
- Phases 3.9–4.9A — Capital state, onchain, sessions, predictions, UI, language

## Recent Agent Updates

### OC — 2026-06-02 — v1.0 Freeze Mission Plan
Commit: ce3c4bb
Changed:
- CLAUDE.md — Added v1.0 Freeze Mission Plan, feature freeze boundaries, reclassified roadmap
Summary:
- Updated title to "Elora Vault v1.0 Freeze — Behavioral Protection Core"
- Added Elora v1.0 Freeze Mission Plan with Behavioral OS loop definition
- Defined v1.0 Included (core capital, Policy Runtime, Intent, Activity, security hardening)
- Defined Explicitly Not v1 (auto-execution, yield, paymasters, Base Account migration, etc.)
- Defined Allowed Work During Freeze (UX polish, bugs, security, simplification, docs)
- Defined Forbidden Work During Freeze (new layers, auto-execution, yield, gamification, AI capital)
- Added Definition of v1.0 Done (15 criteria for feature-freeze readiness)
- Reclassified Remaining Items into Freeze-Allowed Refinement / Post-User-Validation / Research Only
- Preserved all existing agent coordination rules and history
Validation:
- lint: pass
- typecheck: pass
- build: pass
- contracts:test: not run
Notes:
- Documentation / coordination work only — no application code changed
- v1.0 freeze establishes a hard boundary against scope creep before real users arrive
- All policy suggestions invariant (`requiresConfirmation: true`) is preserved and reinforced
Signed: OC

## Remaining Items (v1.0 Freeze Reclassification)

### A. Freeze-Allowed Refinement
- **Stronger empty states** — New user onboarding
- **Horizon detail surfaces** — Individual horizon cards (if it simplifies clarity)
- **Prediction terminology migration** — "Bet" → "Prediction" in API/DB (post-freeze unless needed for safety or clarity)

### B. Post-User-Validation (v1.1+)
- **Policy execution wiring** — Wire accepted suggestions (protect-profit, delayed-withdrawal) to vault operations
- **Loss→onchain lock creation** — Call createLock on ProtectedVault when prediction loses
- **Base Account → production** — Move from lab to real wallet option
- **Delayed release → production** — Wire release windows to onchain
- **Prediction terminology migration** — "Bet" → "Prediction" in API and DB

### C. Research / Lab Only
- **Yield strategy evaluation** — Aave/Morpho (future)
- **Agent-readable interface / MCP-style access** — Research-only. Any future implementation must be read-only by default, require explicit user approval, expose no signing capability, and never allow autonomous capital movement.

## CI Status
- **ESLint:** ✅ 0 errors, 0 warnings
- **TypeScript:** ✅ clean
- **Next.js build:** ✅ 29 routes, 0 errors

## Agent Coordination

This repository is worked on by multiple AI agents. Coordination rules:

### Source of Truth
- `CLAUDE.md` is the primary source of truth. Read it at the start of every session.
- Refresh repository state from `CLAUDE.md` before doing work.
- Update `CLAUDE.md` after meaningful architectural, infrastructure, UX, policy, security, or Behavioral OS changes.
- Do not rely only on chat memory, stale assumptions, or previous summaries.

### Required Workflow
1. Pull latest `main`.
2. Read `CLAUDE.md`.
3. Read relevant supporting docs if needed (`README.md`, `docs/security/current-security-state.md`, `docs/policy-orchestration.md`).
4. Complete only your assigned task.
5. Avoid overlapping with other agents' likely files unless absolutely necessary.
6. Run validation (`npm run lint`, `npm run typecheck`, `npm run build`; also `npm run contracts:test` if contract-adjacent).
7. Update `CLAUDE.md` with your completed work under `## Recent Agent Updates`.
8. Sign your update clearly using your assigned agent name.
9. Commit and push to `main`.

### Do
- Keep changes scoped
- Preserve Behavioral OS coherence
- Preserve explicit user confirmation
- Preserve EOA fallback
- Preserve RLS/security posture
- Preserve Builder Code fallback behavior
- Preserve transaction safety
- Update documentation when project state changes
- Preserve multi-agent repository continuity

### Do Not
- Commit secrets
- Modify unrelated systems
- Introduce automatic policy execution
- Bypass user confirmation
- Disable RLS
- Expose service-role keys
- Break existing wallet flows
- Assume Base Account or batching support
- Delete other agents' work without justification

### Security Rules
Never commit: `.env`, `.env.local`, `.env.production`, private keys, RPC secrets, Supabase service-role keys, WalletConnect secrets, Base.dev credentials, deployment credentials, or database passwords.

## Recent Agent Updates

### Claude 1 — 2026-06-02 — Behavioral OS product state documentation + Security posture

Commit: `88a6f9e`

Changed:
- `docs/security/current-security-state.md` — Created: 8-section production security posture document
- `README.md` — Added Security section linking to security doc, enhanced disclaimer
- `.env.example` — Fixed merge conflict from remote integration
- `CLAUDE.md` — Added Agent Coordination section, updated route count to 28, added Security docs reference

Summary:
- Created comprehensive security posture document covering security philosophy, auth model, database security (RLS), transaction safety model, Builder Code attribution safety, Base Account lab safety, secret handling rules, Policy Runtime safety invariants, and infrastructure maturity snapshot.
- Linked security document from README under new Security section.
- Added agent coordination rules to CLAUDE.md so future agents have a consistent operating model.
- Fixed stale `.env.example` merge conflict.

Validation:
- lint: ✅ pass
- typecheck: ✅ pass
- build: ✅ pass (28 routes)
- contracts:test: not run (no contract-adjacent changes)

Notes:
- No functional code changes. Documentation and operational hardening only.
- Security posture document is a living document — update when security-relevant changes occur.
- Agent signing convention established. Future agents should add their own entries under `## Recent Agent Updates`.

Signed: Claude 1

### Codex — 2026-06-02 — Agent Coordination Source of Truth

Commit: 932d408

Changed:
- `CLAUDE.md`

Summary:
- Added persistent multi-agent coordination rules directly to the repository source of truth.
- Refreshed stale source-of-truth details for route count, `/settings/labs`, and Builder Code production write-hook wiring.

Validation:
- lint: pass
- typecheck: pass
- build: pass
- contracts:test: not run

Notes:
- Documentation-only coordination update; no contract-adjacent files touched.
- Future agents must read and update `CLAUDE.md` for meaningful repo-state changes.

Signed: Codex

### Codex — 2026-06-02 — Settings Labs Research Separation

Commit: 8586538

Changed:
- `src/app/(authenticated)/settings/page.tsx`
- `src/app/(authenticated)/settings/labs/page.tsx`
- `src/app/(authenticated)/research/page.tsx`
- `src/app/(authenticated)/settings/productive-protection/page.tsx`
- `README.md`
- `CLAUDE.md`

Summary:
- Restored Settings as a calm account, wallet, preference, notification, and policy activity surface.
- Moved productive protection research to `/research` and kept `/settings/productive-protection` as a compatibility redirect.
- Strengthened Labs framing so Base capability detection, routing previews, and orchestration diagrams are explicitly research-only with no production transaction orchestration or automatic capital movement.

Validation:
- lint: pass
- typecheck: pass
- build: pass
- contracts:test: not run

Notes:
- No contract-adjacent files touched.
- Preserves Base capability detection, Builder Code infrastructure, EOA fallback behavior, and existing lab routes.

Signed: Codex

### OC — 2026-06-02 — Empty state & onboarding clarity improvements
Commit: 8eaea0c
Changed:
- `src/app/(authenticated)/vault/page.tsx` — Added new-user explanation when all capital is $0
- `src/app/(authenticated)/intent/page.tsx` — Improved empty state copy and header description
- `src/app/(authenticated)/activity/page.tsx` — Improved empty state with first-step suggestion
- `src/app/(authenticated)/policies/page.tsx` — Expanded empty state with examples + reassurance
- `src/app/(authenticated)/settings/page.tsx` — Clearer header explaining what Settings covers
- `src/app/(authenticated)/settings/labs/page.tsx` — Clearer explanation that Labs never moves capital
Summary:
- Vault: Added contextual explanation of the four capital states when a new user sees $0 everywhere
- Intent: Rewrote empty state to explain what Intent is for and what types of events appear there; reduced jargon in header
- Activity: Suggested depositing as a first step so new users know what to do next
- Policies: Added concrete examples (profit protection, withdrawal cooling) and reinforced that policies never auto-execute
- Settings: Made header explain what the page covers
- Labs: Made it clearer that nothing in Labs moves capital or changes the wallet
Validation:
- lint: pass
- typecheck: pass
- build: pre-existing turbopack/postcss dependency issue
- contracts:test: not run
Notes:
- No tutorials, popups, walkthroughs, marketing, or gamification added
- 42 insertions, 16 deletions across 6 files
- v1.0 Freeze-allowed work: UX polish, copy refinement, onboarding clarity
Signed: OC

### Hermes — 2026-06-02 — v1.0 Freeze Mobile Refinement Pass
Commit: `30ee5b1`
Changed:
- `src/components/layout/mobile-nav.tsx` — Added overflow-x-auto + scrollbar-hide for 7-item nav on small screens
- `src/app/globals.css` — Fixed CSS nesting bug; extracted scrollbar-hide utility; added momentum scrolling
- `src/app/(authenticated)/layout.tsx` — Replaced pb-24 with safe-area-aware pb-[calc(4rem+env(safe-area-inset-bottom))]
- `src/components/capital/capital-modal.tsx` — Overflow-y-auto overlay; reduced mobile p-6→p-5
- `src/app/(authenticated)/intent/page.tsx` — ReleaseConfirmModal: items-start on mobile for scrollable overlay
- `src/app/(authenticated)/vault/page.tsx` — Reduced section spacing space-y-8→space-y-6 md:space-y-8
- `src/components/vault/vault-state-card.tsx` — Reduced mobile padding p-6→p-5 md:p-8
- `src/app/(authenticated)/activity/page.tsx` — Reduced timeline container mobile padding
- `src/app/(authenticated)/policies/page.tsx` — Reduced section spacing
- `src/components/policies/policy-card.tsx` — Reduced mobile padding p-6→p-5 md:p-6
- `tsconfig.json` — Excluded untracked agent WIP files from typecheck
Summary:
- Full mobile refinement pass across all 8 authenticated pages
- Fixed: cramped MobileNav on small screens, broken CSS nesting, hardcoded bottom padding (content hidden on notched phones), modal overflow, oversized spacing/padding on mobile
- Preserved design philosophy, calm UX, all component structure
- No new features, no animations, no desktop redesign
Validation:
- lint: pass
- typecheck: pass
- build: pass (29 routes)
- contracts:test: not run
Signed: Hermes

### Hermes — 2026-06-03 — Repository Stabilization Sprint (P0/P1)
Commit: `ba7f608`

Changed:
- `contracts/lib/` — Installed forge-std + OpenZeppelin Foundry dependencies
- `src/lib/policies/policy-evaluator.ts` — DELETED (orphaned, 0 consumers)
- `src/lib/policies/policy-timeline.ts` — DELETED (in-memory store, 0 consumers)
- `src/lib/policies/policy-state-machine.ts` — DELETED (only consumed by policy-evaluator, dead)
- `src/lib/policies/behavioral-suggestions.ts` — DELETED (0 consumers)
- `src/lib/policies/reflection-layer.ts` — DELETED (0 consumers)
- `src/lib/policies/policy-engine.ts` — Pruned dead exports (evaluatePolicy stub, SUPPORTED_POLICY_TYPES, allowedNextStatuses, ValidationResult)
- `src/lib/capital/capital-state.ts` — Removed 6 redundant alias fields from CapitalBalances and CapitalBalancesFormatted (availableCapital, protectedCapital, releasingCapital, committedCapital, atRisk, total); updated normalizeCapitalState, formatCapitalBalances, getCapitalStateMetrics
- `src/app/(authenticated)/intent/page.tsx` — Updated alias references to canonical names
- `src/app/(authenticated)/insights/page.tsx` — Updated alias references to canonical names
- `src/app/(authenticated)/vault/page.tsx` — Updated alias references to canonical names
- `src/app/(authenticated)/sessions/page.tsx` — Updated alias references to canonical names
- `src/middleware.ts` — Added /policies, /sessions, /insights, /research to protected paths
- `src/lib/yield/yield-strategies.ts` — ARCHIVED to docs/research/yield-strategies-research.ts (0 production consumers)
- `src/lib/account/account-strategy.ts` — ARCHIVED to docs/research/account-strategy-research.ts (0 production consumers)
- `docs/research/` — Created archive directory for research artifacts
- `architectural-diagnosis.md` — Created with 6-section deliverable (diagnosis, cognitive ownership, canonical map, simplifications, boundaries, safety)

Summary:
- P0: Installed Foundry deps — contracts now compile and 22/22 tests pass
- P1.1: Pruned 5 dead policy system modules (~1,100 lines of dead code) — only policy-engine.ts (live API validation) and policy-runtime-evaluator.ts (live evaluation) remain
- P1.3: Removed 6 alias fields from CapitalBalances — -46% interface surface area, one vocabulary for capital state
- P1.4: Archived yield-strategies.ts and account-strategy.ts to docs/research (0 production consumers)
- P1.5: Fixed middleware to protect all 9 authenticated routes
- P1.6: Assessed delayed-release mock render — no actionable duplicate (text explanation + interactive mock are complementary)
- P1.2 (PolicySuggestion types): Assessed but deferred — both PolicySuggestion types serve distinct purposes (orchestration type = concept-oriented, suggestions type = data-oriented). Consolidation would increase coupling risk for no runtime win.
- Preserved all Behavioral OS invariants, EOA compatibility, transaction safety

Validation:
- lint: pass
- typecheck: pass
- build: pre-existing env var issue (28/29 pages, TypeScript clean)
- contracts:test: pass (22/22)

Notes:
- Build failure on /auth/login is pre-existing (missing Supabase env vars for static prerender) — not introduced by this cleanup
- Dead policy modules archived to git history — recoverable if needed
- Research artifacts preserved in docs/research/
Signed: Hermes

### Hermes — 2026-06-03 — Build Environment Hardening Pass
Commit: `5026df6`

Changed:
- `src/lib/env.ts` — Created. Centralized public env variable accessors with clear error messages. Validates NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID as required.
- `src/lib/env-server.ts` — Created. Server-only env accessors for SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL, DIRECT_URL — separated from public env to prevent client bundle leakage.
- `src/lib/supabase/client.ts` — Lazy singleton client creation; uses centralized env validation
- `src/lib/supabase/server.ts` — Uses centralized env validation instead of raw process.env
- `src/lib/web3/config.ts` — Uses centralized env validation for project ID and RPC URLs
- `src/lib/account/builder-code.ts` — Uses centralized env for builder code
- `src/middleware.ts` — Uses centralized env validation; preserves existing route protection
- `src/app/auth/login/page.tsx` — Moved createClient() from module level to event handler (lazy init) — was crashing static prerender
- `src/app/auth/signup/page.tsx` — Same lazy init fix
- `.env.example` — Expanded with clear sections (required/public/server/optional), setup instructions, security notes
- `README.md` — Expanded Quick Start with prerequisites, detailed setup, verification commands, full env variable reference table; updated version badge (v0.9→v1.0); fixed stale architecture references

Summary:
- **Build failure diagnosis**: Root cause identified — auth pages called createClient() at module level during SSR/prerender without env vars. Lazy init fix prevents prerender crashes.
- **Env audit**: 12 env variables categorized. 6 required, 4 optional, 2 deployment-only. All server-only vars separated into env-server.ts.
- **Client/server boundaries**: SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL, DIRECT_URL never referenced in client code. All NEXT_PUBLIC_* vars are safe in client bundles.
- **Build failure on missing env now has clear errors**: Instead of cryptic `@supabase/ssr: Your project's URL...`, users now see: `❌ Missing required environment variable: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` with fix instructions.
- Build still fails without env vars (expected — six required vars), but with actionable error messages pinpointing exactly what's missing.

Validation:
- lint: pass
- typecheck: pass
- build: pre-existing env var requirement (now with clear errors instead of cryptic Supabase errors)
- contracts:test: pass (22/22)

Notes:
- npm run dev works without env validation issues locally (.env.local provides them)
- Build failure is INTENTIONAL — required env vars are actually required for the app to function
- Previously the build failed with a cryptic Supabase error; now it fails with specific variable names and fix instructions
- The env.ts/env-server.ts split ensures server-only credentials never reach client bundles
Signed: Hermes

### Hermes — 2026-06-03 — ARCHITECTURE.md Repository Compression Memory
Commit: `b01732d`

Changed:
- `ARCHITECTURE.md` — Created. Lightweight architectural compression document covering product philosophy, core system overview, canonical ownership map (21 systems), repository boundaries, architectural invariants (9 rules), system flow diagrams (capital, policy, auth, tx lifecycle, build), repository rules (9), operational commands, and future evolution guidance.
- `AGENTS.md` — readers should now also check ARCHITECTURE.md for architectural context before CLAUDE.md for project state.
- `CLAUDE.md` — Added entry for this pass.

Summary:
- Created `ARCHITECTURE.md` as anti-drift infrastructure for the repository
- Every canonical source reference verified against actual filesystem
- Every referenced function/export verified against source code
- No dead systems referenced (pruned modules shown as historical strikethrough)
- Document is ~18KB — intentionally compressed, not exhaustive
- All 9 architectural invariants document what must never break

Validation:
- lint: pass
- typecheck: pass
- build: pre-existing env var requirement
- contracts:test: pass (22/22)

Notes:
- First thing future agents should read — architecture context before project state
- Update this document whenever a new system is added or a canonical source changes
- If this document drifts from reality, someone has broken the anti-drift contract
Signed: Hermes
