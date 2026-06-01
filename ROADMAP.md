# Elora Vault — Roadmap

Elora Vault is a personal discipline system inspired by betting mechanics. It is not a sportsbook, casino, betting exchange, prediction market, DeFi yield product, or real-money gambling operator.

The roadmap keeps one principle at the center:

> The house is virtual. The restraint is real.

Elora should grow as a calm savings and self-custody tool where betting mechanics are used for behaviour design, not wagering.

---

## Completed Foundation

### v0.3 ✅ — Mobile UX & GitHub Presentation

- [x] Mobile-responsive prediction table, transactions, and navigation
- [x] Touch-optimized tap targets (44px minimum)
- [x] Empty, loading, error, and success states for all pages
- [x] Dashboard analytics (win/loss/push count, vault growth chart)
- [x] GitHub README, CHANGELOG, ROADMAP, SECURITY, CONTRIBUTING, LICENSE
- [x] SEO metadata and Open Graph / Twitter Card tags
- [x] Demo data seeding (`demo@elora.app`)

### v0.4 ✅ — Protected Capital

- [x] `VaultLock` database model with status tracking
- [x] Wallet split: locked vs. available vault balance
- [x] Lock creation modal (7/30/90 days / custom date)
- [x] Auto-unlock on expiry (checked on page load)
- [x] Lock cards with countdown timers
- [x] Vault timeline (loss absorption, lock creation, lock release)
- [x] Dashboard "Protected Capital" section
- [x] Settings — default lock duration, auto-lock losses toggle
- [x] `LOCK_CREATED` / `LOCK_RELEASED` transaction types
- [x] Elora Vault branding + rebrand
- [x] Real product screenshots in README

### v0.5 ✅ — Base Vault Layer

- [x] Wallet connection through RainbowKit, WalletConnect, MetaMask, and Coinbase Wallet
- [x] ProtectedVault Solidity contract
- [x] USDC deposits to a self-custodied vault contract
- [x] Onchain timed locks enforced by smart contract logic
- [x] Lock release and withdrawal after expiry
- [x] User-owned vault isolation
- [x] Base mainnet / Sepolia configuration
- [x] Onchain vault dashboard, lock timeline, and countdowns
- [x] No pooled treasury, no admin withdrawals, no rehypothecation

---

## Near-Term — Restraint Polish

- [ ] **Capital safety language pass** — make every screen clear that Elora is discipline software, not gambling or investment advice.
- [ ] **Onchain/offchain mode clarity** — clearly separate simulated training balances from real USDC vault interactions.
- [ ] **Vault action confirmations** — add high-friction confirmations for deposits, locks, releases, and withdrawals.
- [ ] **Cooldown windows** — optional delay before large withdrawals or emergency unlock attempts.
- [ ] **Discipline reports** — weekly/monthly summaries showing wager behaviour, saved losses, lock activity, and restraint streaks.
- [ ] **CSV/PDF export** — export predictions, transactions, locks, vault reports, and discipline summaries.
- [ ] **Advanced analytics dashboard** — interactive charts for vault growth, loss absorption, profit, lock duration, and decision patterns.
- [ ] **Data deletion and account export** — user-owned portability and removal flows.

---

## Mid-Term — Personal Operating System for Betting Discipline

- [ ] **Rule-based bankroll guardrails** — user-defined max stake, max daily exposure, max active predictions, and cooldown after losses.
- [ ] **Loss-streak intervention** — lock new simulated betting after repeated losses and redirect funds into protected capital.
- [ ] **Intent prompts** — require a reason before creating a prediction: entertainment, discipline drill, model test, emotional impulse, or planned strategy.
- [ ] **Decision journal** — attach notes, screenshots, reasoning, and post-settlement reflections to each prediction.
- [ ] **Template library** — saved prediction templates for repeated personal practice scenarios without live odds feeds.
- [ ] **Savings goals** — define vault targets and track progress without turning the app into a bank or investment product.
- [ ] **PWA offline mode** — allow simulated tracking, review, and journaling when offline.
- [ ] **Push notifications** — optional lock release, milestone, and cooldown reminders.

---

## Long-Term — Base-Native Restraint Infrastructure

- [ ] **Proof-of-restraint receipts** — optional signed receipts showing that a user locked capital for a selected duration, without exposing private betting details.
- [ ] **Vault integrity snapshots** — hash local/exported vault records and optionally anchor those hashes on Base for tamper-evident history.
- [ ] **Portable discipline profile** — local-first profile export that can move between deployments or devices.
- [ ] **Open proof compatibility** — make Elora receipts compatible with OpenProof-style verification where possible.
- [ ] **Self-hostable deployment path** — documented path for users to run Elora with their own Supabase/project configuration and contract addresses.
- [ ] **Offline-first verifier** — verify exported vault records, lock receipts, and onchain references without depending on the hosted app.
- [ ] **Modular contract suite** — separate deposit, lock, receipt, and verification concerns into auditable modules before any production-grade release.

---

## Optional Social Layer — Carefully Scoped

Social features should be opt-in, non-predatory, and not designed to create pressure loops.

- [ ] **Private accountability circles** — invite trusted friends to see selected discipline milestones, not balances or betting details.
- [ ] **Achievement system** — focus on restraint, consistency, and savings, not volume wagered.
- [ ] **No global leaderboards by default** — avoid turning discipline into competition.
- [ ] **Shared savings goals** — future team/family vault concepts only after privacy and custody boundaries are clear.

---

## What Elora Vault Will Not Become

- No sportsbook.
- No casino.
- No real-event betting platform.
- No prediction market.
- No peer-to-peer wagering.
- No token launch.
- No staking, yield, leverage, or rehypothecation.
- No pooled treasury controlled by the app.
- No dark-pattern gamification that encourages more betting volume.

Elora can use Base, USDC, and smart contracts, but only to support self-custody, locking, verification, and user-owned records.

---

## Future Philosophy

Elora belongs to a wider ecosystem of quiet tools around proof, privacy, ownership, and restraint.

The long-term direction is:

- **Behaviour design without exploitation** — betting mechanics used to redirect impulses into protected capital.
- **Self-custody without financial theatre** — smart contracts used for locks and ownership, not yield promises.
- **Proof without exposure** — receipts and hashes can verify restraint without publishing sensitive personal history.
- **Local-first records** — the user should be able to export, inspect, and carry their history.
- **Base as infrastructure, not speculation** — low-cost settlement and verification, not token hype.

The product should feel like a personal vault with a stern little lighthouse inside it: not loud, not moralizing, just quietly keeping people away from the rocks. 🕯️
