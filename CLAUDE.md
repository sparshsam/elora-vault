# Elora Vault v0.5 — Self-Custodied Protocol on Base

## Core Concept
Elora Vault is a **self-custodied behavioral savings vault** on Base. NOT a sportsbook, casino, or gambling protocol.

The "house" is a **virtual** opponent ($1B starting, psychological only, offchain). User losses become **onchain protected capital** in the ProtectedVault contract. Lock durations are **cryptographically enforced** — no early unlocks.

### Philosophy
- "Every loss becomes saved capital."
- "Stored today. Available later."
- "Discipline compounds quietly."
- "The house is virtual. The protection is real."

## Architecture

### Onchain (Smart Contracts)
- **ProtectedVault** (`contracts/src/ProtectedVault.sol`) — self-custodied USDC vault
  - Users deposit their own USDC (Base native)
  - Each user's state is isolated (no pooled treasury)
  - Timed locks enforced onchain (1-365 days)
  - Release + withdraw flow after unlock
  - OpenZeppelin (ReentrancyGuard, SafeERC20)
  - No admin-controlled withdrawals, no rehypothecation
- **Foundry** toolchain for testing + deployment

### Offchain (Backend — analytics / metadata only)
- Supabase + PostgreSQL via Prisma
- Backend tracks: analytics, timelines, user preferences, charts
- Backend is **never the source of truth** for locked capital
- Wallet addresses and tx hashes stored for display purposes

### Frontend (Web3)
- wagmi + viem + RainbowKit for wallet connection
- Base network (mainnet + Sepolia)
- Supported wallets: Coinbase Wallet, MetaMask, Rainbow, WalletConnect

## Key Rules
- Balances live onchain (ProtectedVault contract)
- Backend-only balances (user_balance, savings_vault, etc.) are for virtual house tracking
- Stake cannot exceed User Balance (backend)
- No house liability cap — the virtual house has $1B
- Wins: user gets stake + profit, profit deducted from virtual house
- Losses: stake moves to Savings Vault (offchain) + ProtectedVault lock created (onchain)

## Wallet Fields (Backend)
user_balance | savings_vault | withdrawable_winnings | virtual_house_balance (default 1B)
total_deposited | total_wagered | total_saved_from_losses | total_profit_won
wallet_address (0x-prefixed, user's connected Base wallet)

## Transaction Types (Backend)
DEPOSIT | BET_PLACED | WIN_PROFIT | LOSS_TO_SAVINGS | PUSH_RETURN | WITHDRAWAL
LOCK_CREATED | LOCK_RELEASED
ONCHAIN_DEPOSIT | ONCHAIN_LOCK_CREATED | ONCHAIN_LOCK_RELEASED | ONCHAIN_WITHDRAWAL

## Deployment
- **Smart Contracts**: Foundry → Base mainnet/Sepolia
- **Frontend**: Vercel + Supabase
- Push Prisma schema: `npx prisma db push --accept-data-loss`
- Deploy contract: `forge script script/DeployProtectedVault.s.sol --rpc-url base_mainnet --broadcast --verify`
- Update `src/lib/contracts/contracts.ts` with deployed vault address

## Key Files
### Contracts
- contracts/src/ProtectedVault.sol — main vault contract
- contracts/test/ProtectedVault.t.sol — tests (22 tests)
- contracts/script/DeployProtectedVault.s.sol — deployment
- contracts/foundry.toml — build config (Base RPC)
- contracts/lib/openzeppelin-contracts/ — OpenZeppelin v5.6

### Web3 Frontend
- src/lib/web3/config.ts — wagmi/RainbowKit config
- src/lib/web3/providers.tsx — Web3 provider wrapper
- src/lib/web3/hooks.ts — contract interaction hooks
- src/lib/contracts/contracts.ts — chain config + ABI imports
- src/components/web3/ — all Web3 UI components
- src/app/vault/page.tsx — vault dashboard page

### Existing Backend
- prisma/schema.prisma — database schema
- src/lib/liability.ts — profit/return/settlement calculations
- src/store/useWalletStore.ts — Zustand client store
- src/app/api/wallet/route.ts — wallet GET + deposit POST
- src/app/api/wallet/connect/route.ts — wallet address registration
- src/app/api/onchain/event/route.ts — onchain event logging
- src/app/api/bets/route.ts — bet CRUD
- src/app/api/bets/[id]/settle/route.ts — bet settlement
- src/app/api/vault/locks/route.ts — vault lock CRUD
- src/app/api/wallet/transactions/route.ts — transaction history
