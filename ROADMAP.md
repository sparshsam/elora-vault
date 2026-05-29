# Elora Vault — Roadmap

## v0.3 ✅ — Mobile UX & GitHub Presentation
- [x] Mobile-responsive bet table, transactions, and navigation
- [x] Touch-optimized tap targets (44px minimum)
- [x] Empty, loading, error, and success states for all pages
- [x] Dashboard analytics (win/loss/push count, vault growth chart)
- [x] GitHub README, CHANGELOG, ROADMAP, SECURITY, CONTRIBUTING, LICENSE
- [x] SEO metadata and Open Graph / Twitter Card tags
- [x] Demo data seeding (`demo@elora.app`)

## v0.4 ✅ — Protected Capital (Vault Locking)
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

## v0.5 — Planned
- [ ] Savings vault interest / compounding mechanic
- [ ] Advanced analytics dashboard with interactive charts
- [ ] Weekly/monthly discipline reports (PDF/CSV)
- [ ] Loss streak tracking and vault bonuses
- [ ] Email notifications for vault milestones
- [ ] Export data (CSV/PDF)

## v0.6 — Social & Gamification
- [ ] User profiles with discipline scores
- [ ] Achievement system (streaks, milestones, vault targets)
- [ ] Leaderboards (optional, opt-in)
- [ ] Referral vault bonuses
- [ ] Custom betting markets / templates
- [ ] Betting presets and saved templates

## v0.7 — Native & Mobile
- [ ] PWA support with offline mode
- [ ] Push notifications for lock releases and milestones
- [ ] Touch ID / Face ID for vault access
- [ ] Widget for home screen vault glance
- [ ] OS-level shortcuts

## Future Ideas
- Multi-currency vault support
- Team vaults (shared savings goals)
- API for external integrations
- Savings goals with visual progress trackers
- Gamified challenges (30-day discipline challenge)
- Emergency unlock with penalty (time delay + fee)
