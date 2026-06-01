# Changelog

## v0.4 — Protected Capital Vault Locking (2026-05-29)

### Added
- **VaultLock model** with ACTIVE/UNLOCKED/CANCELLED statuses
- **Wallet split**: `locked_vault_balance` and `available_vault_balance` alongside `savings_vault`
- **Transaction types**: `LOCK_CREATED`, `LOCK_RELEASED`
- **POST /api/vault/locks** — create capital locks with 7/30/90 day or custom duration
- **GET /api/vault/locks** — list locks with auto-release of expired locks
- **GET /api/vault/locks/[id]** — single lock details
- **Auto-unlock engine** — expired locks automatically release on any `/api/vault/locks` call
- **LockModal component** — premium fintech dialog for protecting capital
- **LockCard component** — matte dark card with countdown and status
- **VaultTimeline component** — chronological vault activity view
- **Protected Capital section** on dashboard with active locks, locked total, next unlock countdown
- **Vault Preferences** in settings (default duration, auto-lock losses placeholder)
- **Demo data** — 3 vault locks for demo@elora.app (2 active, 1 released)

### UX Copy
- "Protect Capital" language throughout (not "Lock Money")
- "Discipline compounds quietly" messaging
- "Stored today. Available later." countdown copy

### Mobile
- All vault components stack vertically on small screens
- Lock modal is scrollable and thumb-friendly
- Cards use min-width-0 to prevent overflow

## v0.3.1 — Rebrand to Elora Vault (2026-05-29)

### Rebrand
- Project renamed from "Elora" to "Elora Vault"
- `package.json` name changed to `elora-vault`
- All page metadata updated: title, description, OG, Twitter card now "Elora Vault"
- Landing page nav brand updated to "EV" logo + "Elora Vault"
- Hero tagline updated: "v0.3 — Elora Vault — Personal Savings Vault"
- Sidebar brand updated to "EV" logo + "Elora Vault"
- Login page subtitle: "Sign in to your vault"
- All disclaimer footnotes updated to "Elora Vault"
- Deposit disclaimer updated to "Elora Vault"
- Footer text updated to "Elora Vault v0.3"
- Liability engine comment updated
- `README.md` fully rewritten with "Elora Vault" naming
- `CLAUDE.md`, `CONTRIBUTING.md`, `SECURITY.md`, `ROADMAP.md` updated
- Branding consistent across all routes

---

## v0.3 — Mobile Optimization & GitHub Presentation (2026-05-29)

### Mobile Optimization
- Responsive prediction table with card layout on mobile (sm breakpoint)
- Responsive transaction list with card layout on mobile
- Minimum 44px tap targets on mobile for all interactive elements
- Horizontal scroll prevention on all viewports
- Bottom nav bar with safe-area-inset spacing
- Scrollable filter tabs on history page with snap scrolling
- Touch-optimized settlement buttons with active scale feedback
- Prevents overflow-x on html/body

### UI/UX Cleanup
- Dark-mode-first glassy fintech aesthetic (charcoal/black base, soft white text, muted red accents)
- Empty states with contextual messaging for: dashboard, active predictions, history, transactions
- Loading states with spinner animation on all data-fetching pages
- Error states with red alert banners on deposit and settlement
- Success state with green confirmation on deposit
- Consistent product terminology across all pages:
  - User Balance, Savings Vault, Withdrawable Winnings, Virtual House Balance
  - Loss-to-Savings, Active Predictions, Settled Predictions
  - Total Deposited, Total Wagered, Saved From Losses, Total Profit Won
- Balance/number formatting with `tabular-nums` everywhere
- Animated number transitions on stat cards (Framer Motion)

### Dashboard Analytics
- Prediction Analytics section: settled count, won/lost/push breakdown
- Win/Loss/Push ratio bar visualization
- Vault Growth chart (user balance trend over time)
- House vs User comparison bars
- Empty states: "No balance history yet", "No predictions created yet"

### Metadata & SEO
- New title: "Elora — Personal Savings Vault"
- New description with full product positioning
- Open Graph + Twitter Card metadata
- Viewport meta with theme-color

### Repo Hygiene
- `CHANGELOG.md` added (v0.1, v0.2, v0.3)
- `ROADMAP.md` added with future plans
- `SECURITY.md` added
- `CONTRIBUTING.md` added
- `LICENSE` (MIT) added
- `.env.example` updated with empty vars and comments
- `assets/screenshots/` directory created with instructions
- `.gitignore` already covers needed patterns

### README
- Full rewrite as proper public GitHub project page
- Live demo link, tagline, core concept explanation
- Virtual $1B house explanation
- Feature list, tech stack, architecture, DB models
- Local dev setup, env vars, Supabase, Prisma, Vercel deploy
- Roadmap, disclaimer, license sections
- Screenshot preview section (reference assets/screenshots/)

### Tech Stack
- Next.js 16 + TypeScript
- TailwindCSS v4 + shadcn/ui (Base UI React)
- Prisma ORM + PostgreSQL (Supabase)
- Supabase Auth (SSR)
- Zustand + Framer Motion + Recharts

---

## v0.2 — Savings Vault Mechanics (2026-05)

### Added
- Full savings vault implementation
- Virtual house ($1B starting balance) with liability tracking
- Win/Loss/Push settlement with correct balance math
- Live preview on prediction form (projected win/loss/vault)
- Settlement actions on active predictions
- Deposit page with preset amounts
- Prediction history page with status filtering and pagination
- Transaction history page with type-based icons
- Settings page with account info and stats
- Dashboard with 4 primary cards, secondary stats, house vs user comparison
- Balance chart with Recharts
- Responsive sidebar + mobile bottom nav
- Auth middleware with protected routes
- Form validation (stake vs balance, odds cannot be zero)
- Disclaimer banners on all pages
- Glassmorphism UI with dark mode

### Tech Stack
- Next.js 16 (App Router)
- TypeScript
- TailwindCSS v4 + shadcn/ui (Base UI React)
- Prisma ORM + PostgreSQL (Supabase)
- Supabase Auth (SSR)
- Zustand + Framer Motion + Recharts

---

## v0.1 — Initial Foundation (2026-05)

### Added
- Next.js 16 project scaffold with App Router
- TypeScript configuration
- TailwindCSS v4 setup with PostCSS
- Prisma schema: User, Wallet, legacy Bet compatibility table, Transaction models
- Supabase SSR Auth integration
- Zustand wallet store for client-side state
- Liability engine: calculateProfit, validateBet, settleWin/Loss/Push
- Wallet API (GET wallet, POST deposit)
- Predictions API (GET list, POST create)
- Prediction settlement API (PATCH with WIN/LOSS/PUSH)
- Transactions API (GET list with pagination)
- Landing page with features showcase
- Login/signup pages with Supabase auth
- Auth callback handler
- Dashboard layout with sidebar
- Basic route protection with middleware
