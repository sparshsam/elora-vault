# Changelog

## v0.3 — Mobile Optimization & GitHub Presentation (2026-05-29)

### Mobile Optimization
- Responsive bet table with card layout on mobile (sm breakpoint)
- Responsive transaction list with card layout on mobile
- Minimum 44px tap targets on mobile for all interactive elements
- Horizontal scroll prevention on all viewports
- Bottom nav bar with safe-area-inset spacing
- Scrollable filter tabs on history page with snap scrolling
- Touch-optimized settlement buttons with active scale feedback
- Prevents overflow-x on html/body

### UI/UX Cleanup
- Dark-mode-first glassy fintech aesthetic (charcoal/black base, soft white text, muted red accents)
- Empty states with contextual messaging for: dashboard, open bets, history, transactions
- Loading states with spinner animation on all data-fetching pages
- Error states with red alert banners on deposit and settlement
- Success state with green confirmation on deposit
- Consistent product terminology across all pages:
  - User Balance, Savings Vault, Withdrawable Winnings, Virtual House Balance
  - Loss-to-Savings, Open Bets, Settled Bets
  - Total Deposited, Total Wagered, Saved From Losses, Total Profit Won
- Balance/number formatting with `tabular-nums` everywhere
- Animated number transitions on stat cards (Framer Motion)

### Dashboard Analytics
- Bet Analytics section: settled count, won/lost/push breakdown
- Win/Loss/Push ratio bar visualization
- Vault Growth chart (user balance trend over time)
- House vs User comparison bars
- Empty states: "No balance history yet", "No bets placed yet"

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
- Live preview on bet form (projected win/loss/vault)
- Settlement actions on open bets
- Deposit page with preset amounts
- Bet history page with status filtering and pagination
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
- Prisma schema: User, Wallet (with $1B default), Bet, Transaction models
- Supabase SSR Auth integration
- Zustand wallet store for client-side state
- Liability engine: calculateProfit, validateBet, settleWin/Loss/Push
- Wallet API (GET wallet, POST deposit)
- Bets API (GET list, POST create)
- Bet settlement API (PATCH with WIN/LOSS/PUSH)
- Transactions API (GET list with pagination)
- Landing page with features showcase
- Login/signup pages with Supabase auth
- Auth callback handler
- Dashboard layout with sidebar
- Basic route protection with middleware
