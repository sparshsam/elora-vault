# Capital State Architecture Proposal

> **Phase:** 6.6 — Repository Stabilization & Security Completion
> **Status:** Proposal — no production changes made

---

## Current Architecture

### Data sources feeding `useCapitalState()`

The hook in `src/lib/capital-state.ts` merges three independent data sources:

```
┌─────────────────────────────────────────────────────────────┐
│                    useCapitalState()                         │
│                                                              │
│  Source 1:  useWalletStore (zustand)                         │
│             ← fetches from GET /api/wallet on mount          │
│             ← fields: available_vault_balance,                │
│                       locked_vault_balance,                   │
│                       at_risk_balance, savings_vault          │
│                                                              │
│  Source 2:  useVaultSummary + useVaultLocks (wagmi reads)    │
│             ← reads ProtectedVault contract directly         │
│             ← fields: totalDeposited, totalLocked, locks[]   │
│                                                              │
│  Source 3:  useUSDCBalance (wagmi read)                      │
│             ← reads USDC contract for external wallet balance│
│                                                              │
│  Resolution order (Protected balance):                       │
│    vaultLocks.locks > 0  →  sum of lock amounts              │
│    vaultSummary.totalLocked > 0  →  contract totalLocked      │
│    walletStore.locked_vault_balance > 0  →  backend fallback  │
└─────────────────────────────────────────────────────────────┘
```

### Problems

1. **Triple-source ambiguity** — The `Protected` balance depends on which
   source resolves first. A wagmi RPC delay shows one value; a fast
   response shows another. No sync indicator tells the user which source
   they're looking at.

2. **Race condition on initial load** — The zustand store is empty on fresh
   page load (`syncFromServer` runs in a `useEffect`). Until it resolves,
   all balances show `0`, causing a flash of empty state.

3. **Stale zustand** — `syncFromServer` only runs on vault page mount and
   after explicit actions (deposit/protect). If the user opens two tabs
   or switches away and back, balances can be stale.

4. **No loading/error granularity** — `isLoading` is true if EITHER the
   zustand fetch OR the wagmi read is loading. The user can't distinguish
   "loading RPC" from "loading API."

5. **Fallback chain is implicit** — The priority logic is hardcoded in
   `useCapitalState` with no documentation of why one source takes
   precedence over another.

---

## Proposed Architecture: Single Source of Truth

### Option A: Backend-first (recommended for production)

```
┌──────────┐      GET /api/wallet (includes onchain sync)
│  Client  │ ────────────────────────────────────────────►┌───────────┐
│  (page)  │                                               │ Backend   │
│          │◄───────────────────────────────────────────── │ (Prisma)  │
└──────────┘      Response: {                              └───────────┘
                   available: 150.00,                              ▲
                   protected: 500.00,                               │
                   committed: 200.00,                       ┌───────┴───────┐
                   releasing: 0,                            │ Sync Service  │
                   wallet_balance: 2500.00,                  │ (runs after   │
                   last_onchain_sync: "2026-06-01T14:00Z"   │  any tx)      │
                 }                                          └───────────────┘
```

**How it works:**
- The `/api/wallet` endpoint becomes the single source of truth for all
  balance display
- After every onchain action (deposit, protect, release), the client calls
  `/api/onchain/event` which updates the backend (already exists)
- The backend stores the `last_onchain_sync` timestamp for freshness
- On page load, the single fetch populates all balances atomically

**Contract reads are used for verification only:**
- The vault page can show a subtle "verified onchain" indicator
- Contract reads are not used for primary balance display
- Discrepancies between backend and onchain are surfaced as warnings,
  not as different numbers

**Advantages:** Single fetch → single render. No flicker. No ambiguity.

### Option B: Onchain-first

- All balances come from contract reads
- Backend is metadata-only (descriptions, timelines, chart data)
- Requires contract to expose all four balance states (some are
  currently computed offchain)

**Chosen recommendation: Option A** — lower latency, works offline with
stale data, simpler frontend logic.

---

## Migration Plan

1. Add `last_onchain_sync` timestamp to `/api/wallet` response
2. Add a periodic wallet sync endpoint (`POST /api/wallet/sync`) that
   reads onchain state and updates the backend
3. Add a sync indicator component (small checkmark or timestamp)
4. Remove contract reads from `useCapitalState()` for available/committed
   balances (keep for verification badge only)
5. Add webhook or polling (30s) to refresh zustand store automatically
6. Remove the fallback chain logic — single source, single path

### Component changes needed

| Component | Current | Future |
|---|---|---|
| `useCapitalState()` | 3 sources merged | 1 source (backend) + optional onchain badge |
| `useWalletStore` | Manual `syncFromServer` | Auto-poll + event-driven refresh |
| `vault/page.tsx` | `isLoading` from any source | Single loading state from API |
| `ProtectedCapitalPanel` | Reads from wagmi hooks | Reads from zustand (synced from API) |
