<div align="center">
  <br />

  <img src="assets/screenshots/screenshot-main.png" alt="Elora Vault — Landing" width="720" style="border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);" />

  <br /><br />

  <h1>Elora Vault</h1>
  <p>
    <em>Calm behavioral capital infrastructure on Base.</em>
  </p>

  <p>
    <strong>Protect your capital from yourself.</strong><br />
    Separate what is available now from what should be protected for later.
  </p>

  <br />

  <div>
    <img src="https://img.shields.io/badge/version-v0.6-green" alt="Version" />
    <img src="https://img.shields.io/badge/license-AGPL--3.0-blue" alt="License" />
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome" />
    <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase" alt="Supabase" />
    <img src="https://img.shields.io/badge/Base-0052FF?logo=base" alt="Base" />
    <img src="https://img.shields.io/badge/Solidity-363636?logo=solidity" alt="Solidity" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript" alt="TypeScript" />
  </div>

  <br />

  <p>
    <a href="https://elora-bet-api.vercel.app" target="_blank"><strong>Live Demo →</strong></a>
    &nbsp;&nbsp;·&nbsp;&nbsp;
    <a href="#quick-start"><strong>Quick Start</strong></a>
    &nbsp;&nbsp;·&nbsp;&nbsp;
    <a href="#features"><strong>Features</strong></a>
    &nbsp;&nbsp;·&nbsp;&nbsp;
    <a href="#architecture"><strong>Architecture</strong></a>
  </p>

  <br />
</div>

---

## What is Elora Vault?

Elora Vault is a **self-custodied behavioral savings vault built on Base**. It helps users separate capital that is available now from capital that should be protected for later.

The product is designed around one simple idea: not every dollar should feel equally available.

Elora is not a sportsbook, casino, prediction market, or gambling operator. It does not place wagers, provide odds, or connect to live events. Its prediction tools are a private bankroll-accounting layer: users can record decisions, commit capital, settle outcomes, and protect profits into timed horizons.

The mission is to grow Elora into a **fully Base-native behavioral capital app**: self-custodied, account-aware, low-friction, and quietly onchain. Base should become the invisible settlement and account layer beneath a calm financial interface — not the loudest part of the product.

### What Elora Vault IS

- A self-custodied USDC vault with timed protection horizons
- A calm capital-state system: Wallet, Available, Protected, Releasing, and Committed
- A private prediction/accounting layer for disciplined bankroll behavior
- A post-outcome protection system for preserving profit after volatile decisions
- A Base-native app with wallet connection, contract reads, and onchain vault actions
- Behavioral financial infrastructure designed to reduce impulsive capital movement

### What Elora Vault IS NOT

- Not a sportsbook, casino, or gambling operator
- Not a wagering platform, exchange, or odds provider
- Not connected to live odds or real event execution
- Not a custodial pooled treasury
- Not a DeFi yield dashboard or trading terminal

---

## Current Product Model

Elora separates money into two layers.

### 1. Connected Wallet

External USDC held in the connected wallet. This money is outside Elora until deposited.

### 2. Elora Capital

Capital deposited into Elora and represented across four states.

| State | Meaning |
|---|---|
| **Available** | Deposited capital available inside Elora. |
| **Protected** | Capital protected inside active horizons. |
| **Releasing** | Protected capital returning to availability. |
| **Committed** | Capital allocated to active predictions. |

The core accounting rule is:

```text
totalEloraCapital = available + protected + releasing + committed
```

External wallet balance is intentionally excluded from `totalEloraCapital`.

---

## Core Flows

| Flow | Capital Movement |
|---|---|
| **Deposit** | Connected Wallet → Available |
| **Protect Capital** | Available → Protected |
| **Release Horizon** | Protected → Releasing → Available |
| **Log Prediction** | Available → Committed |
| **Prediction Won** | Committed → Available by total return |
| **Prediction Lost** | Committed decreases by stake |
| **Prediction Push** | Committed → Available by stake |
| **Protect Profit** | Available → Protected |
| **Withdraw** | Available → Connected Wallet |

---

## Product Surfaces

| Page | Purpose |
|---|---|
| **Vault** | A clear view of wallet balance and Elora capital. Deposit, withdraw, protect capital, and review active states. |
| **Sessions / Predictions** | Log predictions, commit capital, calculate potential return, settle outcomes, and protect profit. |
| **Activity** | Chronological record of deposits, protections, releases, withdrawals, and prediction events. |
| **Intent** | Decision layer for release confirmations, protection opportunities, and deliberate capital movement. |
| **Settings** | Account and application controls. |

---

## Features

| Feature | Status |
|---|---|
| **Top-header Navigation** — Vault, Sessions, Activity, Intent | ✅ Live |
| **Wallet Connection** — RainbowKit, WalletConnect, MetaMask, Coinbase Wallet | ✅ Live |
| **Disconnect / Network Controls** — visible wallet actions in header | ✅ Live |
| **Base Sepolia Support** — wallet network checks and contract wiring | ✅ Live |
| **ProtectedVault Contract** — self-custodied timed USDC vault | ✅ Live |
| **Onchain Deposits** — USDC deposit flow with approval handling | ✅ Live |
| **Timed Horizons** — 7 / 30 / 90 / 180-day capital protection | ✅ Live |
| **Release Flow** — horizon release with Intent confirmation | ✅ Live |
| **Capital State Engine** — Wallet, Available, Protected, Releasing, Committed | ✅ Live |
| **Prediction Logging** — description, type, odds, stake, calculated return | ✅ Live |
| **Prediction Settlement** — Won / Lost / Push accounting | ✅ Live |
| **Post-Win Protection** — protect profit or full return into a horizon | ✅ Live |
| **Activity Timeline** — live capital and prediction event feed | ✅ Live |
| **Intent Layer** — protection opportunities and release decisions | ✅ Live |
| **Supabase Persistence** — users, wallet state, predictions, sessions, locks, transactions | ✅ Live |
| **Responsive Layout** — desktop and mobile navigation | ✅ Live |
| **AGPLv3 License** — open-source distribution | ✅ Live |

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/sparshsam/elora-vault.git
cd elora-vault

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with Supabase, WalletConnect, and contract configuration

# Push database schema and start
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Prerequisites:** Node.js 22+, npm, a Supabase project, WalletConnect project ID, and Base Sepolia-compatible wallet setup.

---

## Screenshots

Screenshots may lag behind the current UI while the product is moving quickly.

| Surface | Screenshot |
|---|---|
| Landing | `assets/screenshots/screenshot-main.png` |
| Desktop | `assets/screenshots/landing-desktop.png` |
| Dashboard / Vault | `assets/screenshots/dashboard-desktop.png` |
| Mobile | `assets/screenshots/dashboard-mobile.png` |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 App Router |
| **Language** | TypeScript |
| **Styling** | TailwindCSS v4 + custom design tokens |
| **Database** | PostgreSQL via Supabase |
| **ORM** | Prisma |
| **Auth** | Supabase Auth SSR |
| **State** | Zustand + contract-derived hooks |
| **Web3** | wagmi + viem + RainbowKit |
| **Smart Contracts** | Solidity + Foundry |
| **Contracts Library** | OpenZeppelin |
| **Network** | Base Sepolia |
| **Deploy** | Vercel |

---

## Architecture

```text
src/
├── app/
│   ├── (authenticated)/
│   │   ├── vault/          → capital state home
│   │   ├── sessions/       → prediction logging and settlement
│   │   ├── activity/       → chronological capital memory
│   │   ├── intent/         → protection and release decisions
│   │   └── settings/       → account controls
│   ├── api/
│   │   ├── bets/           → prediction create/list/protect/settle endpoints
│   │   ├── sessions/       → session persistence endpoints
│   │   └── wallet/         → wallet state and transaction history
│   ├── auth/               → login, signup, callback
│   └── page.tsx            → landing page
├── components/
│   ├── capital/            → deposit, withdraw, protect modals
│   ├── layout/             → top header and mobile navigation
│   ├── vault/              → capital state cards and horizon surfaces
│   ├── wallet/             → wallet control components
│   └── ui/                 → shared interface primitives
├── contracts/              → ProtectedVault Solidity contract
├── lib/
│   ├── capital-state.ts    → canonical capital state model
│   ├── web3/               → contract read/write hooks
│   ├── contracts/          → ABIs and contract config
│   ├── supabase/           → client/server helpers
│   └── prisma.ts           → Prisma client singleton
├── prisma/
│   └── schema.prisma       → data model
└── middleware.ts           → auth protection
```

---

## Database Concepts

The schema is evolving, but the main product entities are:

| Entity | Purpose |
|---|---|
| **User** | Authenticated Supabase user mapped into app data. |
| **Wallet** | User-level capital accounting, including available and committed balances. |
| **VaultLock** | A protected horizon with amount, duration, release timing, and ownership. |
| **Bet / Prediction** | A private prediction record with odds, stake, potential return, and settlement status. |
| **Session** | Optional behavioral context around prediction activity. |
| **Transaction** | Activity feed events for deposits, protections, releases, withdrawals, and prediction outcomes. |

Backward-compatible database names may still use `Bet` or `at_risk_balance` internally while the user-facing product language moves toward Predictions and Committed Capital.

---

## Smart Contract Model

`ProtectedVault.sol` is the onchain protection layer for USDC vault actions.

Core properties:

- Self-custodied USDC vault behavior
- Timed capital locks / horizons
- No pooled treasury assumption in the product model
- No admin withdrawal UX
- User-specific balances and lock state
- Base Sepolia deployment for current testing

Core actions:

```text
deposit USDC
create protection horizon
release eligible horizon
withdraw available capital
```

---

## Base-Native Mission

Elora’s long-term direction is to become a fully Base-native behavioral capital app.

That means Base is not an add-on or branding layer. It is the settlement, custody, account, and composability foundation for the product.

Planned Base-native evolution:

- **Base Account / smart-wallet UX** — reduce wallet friction while keeping self-custody intact
- **Gas abstraction where appropriate** — make protection flows feel calm and non-technical
- **Onchain activity provenance** — capital movement should be independently verifiable
- **Deeper contract-backed horizons** — protection periods should become durable onchain commitments
- **Base-native USDC flows** — keep the core product focused on simple, understandable capital movement
- **Optional future yield layers** — only if risk, custody, and UX remain aligned with Elora’s restraint-first philosophy

The goal is not to make users think about crypto more. The goal is to make Base quietly handle ownership, settlement, and permanence underneath a simple capital interface.

---

## Design Philosophy

Elora is intentionally restrained.

The interface avoids sportsbook aesthetics, casino language, DeFi noise, and dopamine-driven financial UX. The design direction is warm stone, botanical green, soft borders, quiet typography, and clear financial state separation.

The product should feel less like a dashboard and more like a calm financial operating system.

---

## Roadmap

Near-term priorities:

- Complete prediction terminology migration across code and UI
- Improve homepage positioning and public product narrative
- Build richer horizon detail surfaces
- Strengthen Activity event indexing and reconciliation
- Improve Intent protection opportunities and release decisions
- Add clearer empty states and first-run onboarding
- Transition wallet UX toward Base Account / smart-wallet infrastructure
- Continue moving Elora toward a fully Base-native app architecture

Future explorations:

- Named horizons
- Longitudinal capital memory
- Optional rules for automatic post-profit protection
- Base-native account abstraction
- Quiet gas abstraction and sponsored protection flows
- Contract-level horizon improvements
- Yield strategies for protected USDC, only if aligned with the product’s calm-risk philosophy

---

## License

Elora Vault is licensed under the **GNU Affero General Public License v3.0**.

See [`LICENSE`](LICENSE) for details.

---

## Disclaimer

Elora Vault is experimental software. It is not financial advice, not a sportsbook, not a casino, and not a gambling operator. The prediction logging system is private record-keeping only and does not place wagers or connect to live betting markets.

Use testnet deployments carefully. Do not deposit funds you cannot afford to lose into experimental software.
