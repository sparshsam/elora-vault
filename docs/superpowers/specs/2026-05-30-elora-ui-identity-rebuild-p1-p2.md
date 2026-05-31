# Elora Vault — UI Identity Rebuild: Phase 1 & 2

**Date:** 2026-05-30
**Status:** Approved Design Spec — Ready for Implementation Planning (Refined)
**Project:** Elora Vault v0.5
**Repo:** `github.com/sparshsam/elora-vault.git`

---

## Overview

Elora Vault is a self-custodied behavioral savings protocol on Base. The onchain primitive (wallet connect, USDC deposit, protected vault locks, lock timers, BaseScan links, query invalidation, onchain state updates) is complete and working. No further backend or smart contract feature work is planned.

This phase is a **UI identity rebuild only**. The backend APIs, smart contracts, Prisma schema, and data layer remain untouched. This spec covers:

- **Phase 1:** UX Architecture — information architecture, navigation, emotional flow, page purposes
- **Phase 2:** Emotional Language System + Design System — vocabulary, tone, colors, typography, spacing, motion, components

Implementation sequencing is scoped to the **design system foundation** first (design tokens, typography, color system, spacing, base surface components, navigation shell). Full page rebuilds (Landing, Vault, Intent, Activity) are deferred to a subsequent phase.

---

## Core Design Philosophy

Elora Vault should **not** feel like:
- A crypto dashboard
- A DeFi protocol
- A trading terminal
- An analytics app
- An admin panel
- A sportsbook backend

It should feel like:
- Calm financial architecture
- Behavioral savings
- Emotionally frictionless discipline
- Modern banking simplicity
- Invisible onchain infrastructure

**The frontend should emotionally disappear.** The product should feel clean, spacious, reassuring, elegant, and psychologically intentional. Think Base, Apple Wallet, Arc Browser, Linear, Cash App minimalism, modern private banking, soft fintech UX — not cyberpunk crypto, terminal dashboards, glowing charts, tiny widgets, or over-engineered DeFi complexity.

**Base integration philosophy:** The long-term goal is not "a dApp on Base" but "an experience that feels naturally born from Base." One-tap wallet feel. Invisible chain mechanics. Soft account abstraction. Minimal transaction anxiety. Almost no crypto vocabulary exposed. The user should emotionally experience clarity, not blockchain.

**Critical tone boundary:** This is NOT a meditation app or a therapy product. The feel is *premium banking meets intentional financial architecture* — calm and precise, not spiritual or poetic. No "breathe deeply" or "protect your energy" copy. The emotional register is **restrained confidence**, not wellness. Think Apple or Linear: calm through precision, not through softness alone.

**Balance: architectural calm, not floating wellness.** Spaciousness must be paired with sharp typography, strong grid alignment, obvious hierarchy. White space is intentional (not decorative). The product should feel *architectural* — clean lines, clear structure — not vague or toy-like. Too much rounding or empty space risks making it feel unserious.

---

## Strategic Constraints (Binding)

These constraints govern every implementation decision. Violating them is a design regression.

### 1. Build Fewer Components Than Feels Comfortable

A small vocabulary creates identity. If two components feel emotionally similar, **merge them.** Elora should feel almost monastic — not fragmented into 19 card types, 14 button variants, and dozens of spacing exceptions.

**Rule:** Every new component must justify its existence against "could this be an existing component with a prop change?" If it's close, it's not worth the new surface.

### 2. Preserve Existing Backend Stability Aggressively

The current architecture (deposits, reads, locks, query invalidation, Base Sepolia flow) is stable and working. The UI rebuild wraps existing flows — it does not reinvent them.

**Rule:** No logic rewrites. No backend refactors. No schema changes. Every new component calls existing APIs with the same data contracts.

### 3. Do Not Accidentally Reintroduce Dashboard Density

Engineers naturally want to add more metrics, expose more data, surface more controls, fill whitespace. **Resist this constantly.** A blank area is often doing emotional work.

**Rule:** When adding a new data point to a view, remove an existing one. The total information density should go down, not up.

### 4. The First Real Test Is Not Beauty

The benchmark is: "How does it feel after using it for 10 minutes?" An interface can impress for 20 seconds and exhaust by minute 8. Elora should feel **calmer the longer someone uses it.**

**Rule:** Every implementation pass must include a "10-minute walkthrough" sanity check — does the screen still feel calm after extended use? If not, it needs less.

### 5. The Product Should Feel More Expensive Than It Is

Not luxurious or flashy — expensive in the sense that every decision feels deliberate, nothing feels accidental, interactions feel considered. The strongest signal of sophistication is restraint.

**Rule:** Before shipping any new component, remove one thing from it. If the component still works, ship the simpler version.

### 6. Intent Is the Signature Experience

Vault is the anchor. Activity is the memory. But **Intent is the identity.** That is the surface users will remember emotionally. Implementation planning must protect Intent carefully: no clutter, no stacking, no side quests, no utility-menu drift. It should feel almost unnervingly focused — like the product is quietly asking "What do you actually want to do?" and then getting out of the way.

**Rule:** Intent gets the most implementation scrutiny. Every element on Intent must pass: "Does this help the user make a single, focused decision right now?" If no, remove it.

---

## Phase 1: UX Architecture

### Simplified Navigation Tree

```
PUBLIC (no auth required)
├── Landing        /               → Emotional introduction
├── Sign In        /auth/login     → Calm, minimal
└── Create Account /auth/signup    → Calm, minimal

APP (auth required)  — 4 destinations only
├── VAULT          /vault          → PRIMARY — emotional center
├── ACTIVITY       /activity       → REFLECTION — unified timeline
├── INTENT         /intent         → DECISION — focused decision space
└── SETTINGS       /settings       → CONFIG — quiet, tucked away
```

**Desktop layout:** Slim sidebar nav (icon + text). Vault is the default landing after authentication. Settings sits at the bottom of the sidebar, visually de-emphasized with smaller type.

**Mobile layout:** Bottom tab bar with 3 items — VAULT (shield icon) | ACTIVITY (timeline icon) | INTENT (arrow/bolt icon). Settings via a gear icon in the top-right corner of any screen. Navigation is always within thumb reach.

### Page Fates

| Current Page | Fate | Rationale |
|---|---|---|
| Dashboard | **Merged into Vault** | "Dashboard" is a crypto terminal concept. Vault IS the user's financial state. |
| New Bet | **Becomes Intent** | A form becomes a decision surface. |
| Open Bets | **Merged into Activity** | Filtered view ("In Motion") within the unified timeline. |
| Bet History | **Merged into Activity** | Part of the chronological feed. |
| Transactions | **Merged into Activity** | Part of the chronological feed. |
| Vault | **Stays, expanded as primary** | Absorbs dashboard state. New component architecture. |
| History | **Renamed → Activity** | "History" feels archival. "Activity" feels alive and reflective. |
| Settings | **Stays, simplified** | Smaller, quieter, tucked away. |
| - | **New: Intent** | One decision at a time. Giant decision surfaces. |

### Page-Purpose Definitions

**VAULT** — *"Your protected financial state."*
- Shows three clear capital states: **Available**, **In Motion**, **Protected**
- Active lock timeline (visual, scrolling card feed)
- Quick decision entry points that link to Intent
- No dense tables. No charts by default. No fragmented widgets.
- Present-tense: "This is where your capital is right now."

**ACTIVITY** — *"Your behavioral journey."*
- Single unified chronological feed of all capital movement
- Filterable: All | Wagers | Locks | Deposits
- Each entry is a calm, spacious card — not a table row
- Subtle emotional indicators (color coding, icons) — not admin metadata
- Past-tense: "This is what happened."

**INTENT** — *"The focused decision space where you choose what should happen next."*
- This is NOT a page of options. It is a **decision router.**
- Arrives at one binary choice at a time, tailored to the user's current state
- Example: "You have 500 USDC available. What should happen?" → Keep Flexible / Protect Capital
- After choosing, the next decision surfaces (e.g., if Protect: choose horizon via HorizonCards)
- It should never feel like a generic "Actions" page
- Present-future tense: "What do you want to happen next?"

**Intent: Empty state is critical.**
When no decisions are available, the page must not feel blank or broken. It should feel *complete:*

> "Nothing needs your attention right now."
> "Your capital is already settled."
> [Return to Vault]

This empty state is part of the emotional architecture — it reinforces that the user is in good standing, not that the page is useless. Intent is a deliberate psychological space, not a utility menu.

**SETTINGS** — *"Quiet and minimal."*
- Wallet connection status and network info
- Account preferences
- Notification settings (if applicable)
- Security options
- Minimal, tucked away. Users should rarely need to visit.

### Emotional Flow Diagram

```
LANDING
  │  "Protect your capital from yourself."
  │  Emotion: curiosity → recognition
  │
SIGN IN (or Create Account)
  │  Emotion: trust → welcome
  │
VAULT ←— AUTH DEFAULT
  │  Shows: Available | In Motion | Protected
  │  Emotion: clarity → calm
  │
  ├─────► INTENT ("What should happen next?")
  │        One binary choice at a time
  │        Emotion: intentional → committed
  │        Back to VAULT
  │
  └─────► ACTIVITY ("What has happened?")
           Unified timeline
           Emotion: reflection → awareness
```

The emotional loop: **VAULT** (where am I) → **INTENT** (what do I choose) → **VAULT** (see the result) → **ACTIVITY** (reflect on the journey).

### Language Restraint: Protecting "Protected"

The word "Protected" is emotionally powerful *because* it feels rare and important. Overuse exhausts its impact.

**Rule:** "Protected" is the **capital state label** only. Vary surrounding language:

| Instead of | Use |
|---|---|
| Protect your capital | "Set a horizon" / "Reserve capital" |
| Protect this amount | "Move funds into a horizon" |
| Lock duration | "Discipline period" |
| Lock release | "Release date" |
| Locked capital | "Capital in a horizon" |

The emotional effect of "Protected" becomes stronger through restraint. Use it sparingly, in the moments that matter most.

### Capital State System

| State | Label | Meaning | Visual |
|---|---|---|---|
| Free capital | **Available** | Funds the user can freely use, wager, protect, or withdraw | White surface, no emphasis |
| Unresolved wager | **In Motion** | Capital currently tied to an unresolved wager or flow | Soft green indicator |
| Time-locked capital | **Protected** | Capital locked by a time horizon in the ProtectedVault contract | Solid green surface, timer display |

### What Gets Merged or Removed

- Dashboard → Vault
- Open Bets → Activity (filtered as "In Motion")
- New Bet → Intent
- Bet History → Activity
- Transactions → Activity
- History → Activity (renamed)

**Mobile priority is not optional.** The ideal emotional experience is: phone in hand, single thumb, one calm decision at a time. This is where the product identity becomes memorable. Do not accidentally optimize for desktop-first dashboard behavior — mobile is the primary canvas.

### Mobile-Specific Architecture

- Bottom tab bar (3 items): Vault, Activity, Intent — always visible
- Settings: top-right gear icon, opens as a bottom sheet
- Intent on mobile: full-screen decision steps, large touch targets, swipe gestures
- Vault on mobile: stacked sections (Available → Protected → In Motion) rather than side-by-side
- Activity on mobile: same timeline, cards stack full-width
- All modals use bottom sheets rather than centered overlays (iOS-native feel)
- Primary actions in bottom third of screen (thumb zone)
- Touch targets: minimum 48px. Decision cards are full-width.

### Binary Decision Rules (for Intent)

To prevent Intent from decaying into a generic actions page, define strict rules for what appears here:

1. **One surface at a time.** Intent surfaces ONE binary choice. When the user completes it, the next choice may appear. Never show a list of options.
2. **A "decision" = a meaningful behavioral choice.** Placing a wager, setting a horizon, withdrawing, releasing. NOT: changing display settings, editing preferences, viewing details.
3. **What gets deferred to Settings:** Any configuration that doesn't move capital. Wallet preferences, notification settings, display preferences, account details.
4. **When Intent is empty:** The page shows its complete empty state (see above). Not a gray "no data" placeholder — a deliberate, peaceful message.
5. **No stacking.** If multiple decisions are available, Intent shows the most important one. The user completes it, sees the result in Vault, and returns to Intent for the next decision.
6. **Emergency override:** If a critical action is needed (e.g., release available), Intent elevates it above all else. This is rare.

These rules are the discipline that keeps Intent from becoming a menu.

### Rationale for Every Structural Decision

**Why Vault as default landing?**
The first thing a returning user wants is "what's my state." Not "what can I do" or "what happened." State first, then decisions, then reflection.

**Why merge Dashboard, Open Bets, History, and Transactions?**
These 4 old pages mapped to table-like admin views. The user is not an operator managing bets — they are a person managing their financial behavior. Vault (state) + Activity (timeline) removes the admin panel feeling.

**Why make Intent a separate page?**
Decisions need focus. A decision surface surrounded by other information dilutes intentionality. The user goes to Intent knowing "I am here to make a choice," not "I am browsing my vault and here's a form."

**Why keep Settings quiet and small?**
Settings is infrastructure, not experience. Users should think about it as rarely as possible.

**Why not combine Activity into Vault?**
Reflection and state are different mental modes. Seeing current state AND full history on one page creates overwhelm. Vault is present-tense. Activity is past-tense.

---

## Phase 2: Emotional Language System

### How Elora Speaks

Elora's voice is a **calm, intelligent companion** for your financial self. Not a salesman, not a robot, not a crypto bro. The one-sentence personality:

> *Warm professionalism. Restrained confidence. Human clarity.*

### Approved Vocabulary

| Category | ✅ Approved |
|---|---|
| **Capital** | Protect, Protected, Available, Reserve, Locked, Released, In Motion |
| **Time** | Horizon, Duration, Period, Cycle, Cooldown |
| **Decisions** | Intent, Choose, Commit, Decide, Set |
| **State** | Calm, Steady, Clear, Settled, Active |
| **Money** | Capital, Balance, Funds, USDC |
| **Outcomes** | Settled, Released, Returned, Completed |
| **User** | You (always), Your capital, Your balance |
| **Crypto** | Wallet, Network, Address (technical context only) |

### Forbidden Vocabulary

| Category | ❌ Forbidden |
|---|---|
| **Capital** | Exposed, Leveraged, Staked, Pooled |
| **Time** | Countdown, Race, Deadline |
| **Decisions** | Submit, Execute, Confirm (transactionally), Approve (except wallet) |
| **State** | Aggressive, Urgent |
| **Money** | Cash out, Payout, Winnings |
| **Outcomes** | Win (as noun), Loss (as noun), Victory, Defeat |
| **User** | User, Customer, Member, Player |
| **Crypto** | Gas, Gwei, RPC, Chain, Mainnet (as UI labels) |
| **Emotion** | Hype, Pump, Moon, Degenerate, Ape, LFG |

**When technical language IS appropriate:** Settings → Wallet info (network, address, contract link). Hidden behind detail views.

**When it stays hidden:** "Lock duration" becomes "How long do you want to protect this?" "Transaction hash" becomes "View on BaseScan."

### Navigation Naming Decision

| Label | **Intent** (selected) |
|---|---|
| Rationale | "Intent" is a calm, reflective question: *What is your intent?* It implies purpose, not transaction. Short enough for mobile tabs. Emotionally precise. |
| Rejected alternatives | Actions (too generic), Protect (too narrow), Choose (too vague), Commit (too heavy), Flow (too ambiguous), Next (too sequential) |

### Tone Principles

1. **Calm over urgency** — Never rush the user. "Take your time. Choose what's right for you."
2. **Clarity over density** — One concept per card. Never a table of data as the primary view.
3. **Confidence over hype** — "Settled." not "You crushed it!" Restraint breeds trust.
4. **Guidance over complexity** — "This transaction couldn't complete. Your funds are safe." not "Tx failed."
5. **Restraint over stimulation** — No glowing elements, particle effects, or dopamine animations.
6. **Softness over aggression** — Rounded surfaces, generous space, light greens. Never sharp corners, high contrast, or dense type.
7. **Intentionality over impulse** — Decisions are deliberate. The UI supports reflection, not reflex.

### Interaction Copy Standards

- Confirmations: "Are you sure?" → "Does this feel right?"
- Errors: "Something went wrong." → "This didn't complete. Your funds are safe."
- Empty states: "No data" → "Nothing in motion right now."
- Duration selection: "Select lock duration" → "Choose your discipline horizon."
- Balance display: "Balance" → "Available" (when free), "Protected" (when locked)

---

## Phase 2: Design System

**Underlying philosophy:** This is not a "crypto app redesign." The goal is for Elora to feel **naturally born from Base** — not like a dApp integrated with Base. The user should emotionally experience clarity, not blockchain. One-tap wallet feel, invisible chain mechanics, minimal transaction anxiety, almost no crypto vocabulary exposed.

The design system balances **calm with precision** — generous spacing paired with sharp typography, soft green accents with strong grid alignment, spacious surfaces with obvious hierarchy. Think "architectural calm" — clean lines and clear structure — not "floating wellness blobs."

### Palette

**Primary identity:** White + green. Bright white surfaces, soft green accents, minimal black.

```css
/* Surfaces */
--color-surface:           #FFFFFF;       /* Primary surface */
--color-surface-subtle:    #F8FAF8;       /* Card backgrounds, secondary areas */
--color-surface-hover:     #F3F5F3;       /* Hover states */

/* Borders */
--color-border:            #E8EBE8;       /* Default borders */
--color-border-hover:      #D0D5D0;       /* Hover borders */

/* Text */
--color-text-primary:      #1A1D1A;       /* Main text */
--color-text-secondary:    #5A5E5A;       /* Supporting text */
--color-text-tertiary:     #A0A5A0;       /* Labels, hints */
--color-text-inverse:      #FFFFFF;       /* On dark fills */

/* Green — Protection, Growth, Calm Discipline */
--color-green-50:          #F0FDF4;       /* Lightest background tint */
--color-green-100:         #DCFCE7;       /* Subtle fills */
--color-green-200:         #BBF7D0;       /* State indicators, progress */
--color-green-400:         #4ADE80;       /* Active/positive indicators */
--color-green-500:         #22C55E;       /* Primary green - CTAs, key elements */
--color-green-600:         #16A34A;       /* Hover states */
--color-green-700:         #15803D;       /* Text on light backgrounds */

/* Semantic (rarely used) */
--color-success:           var(--color-green-500);
--color-warning:           #F59E0B;       /* Soft amber - very rare */
--color-danger:            #EF4444;       /* Almost never - critical errors only */
--color-info:              #3B82F6;       /* Links only */
```

**Usage philosophy:** Green appears as fills and accents for meaningful states (protected capital, success, positive action). White dominates everything. Black is minimal (headings only). Gray bridges them. Color is never decorative — it always signals state.

### Typography

**Primary font:** Inter (sans-serif). Clean, excellent readability, modern without being trendy.

```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

--text-hero:        64px / 1.1    weight: 300    /* Landing headline */
--text-display:     36px / 1.2    weight: 400    /* Page titles */
--text-heading:     24px / 1.3    weight: 500    /* Card titles, section headers */
--text-subheading:  18px / 1.4    weight: 500    /* Card subtitles */
--text-body:        16px / 1.6    weight: 400    /* Primary reading */
--text-small:       14px / 1.5    weight: 400    /* Metadata, timestamps */
--text-tiny:        12px / 1.4    weight: 500    /* Labels, badges */
--text-number:      48px / 1.0    weight: 300    /* Balance displays (can scale down on mobile to 32px) */

/* Letter spacing */
--tracking-display:  0.02em;     /* Display text only */
--tracking-normal:   0em;         /* Body text */
--tracking-number:   0em;         /* Numbers - tabular */
```

### Spacing System

Base unit: 4px. Scale is generous — double what a crypto dashboard would use.

```css
--space-xs:   4px;
--space-sm:   8px;
--space-md:   16px;
--space-lg:   24px;
--space-xl:   32px;
--space-2xl:  48px;
--space-3xl:  64px;
--space-4xl:  96px;
--space-5xl:  128px;
```

**Philosophy:** White space is not wasted space — it's emotional breathing room. Page content should never feel dense. Cards have generous internal padding (24-32px minimum).

### Border Radius

```css
--radius-sm:    8px;    /* Small elements, pills, badges */
--radius-md:    12px;   /* Default card radius */
--radius-lg:    16px;   /* Large surfaces, vault panels */
--radius-xl:    24px;   /* Hero sections, landing blocks */
--radius-full:  9999px; /* Pills, status indicators */
```

### Shadow System

```css
--shadow-sm:    0 1px 2px rgba(0,0,0,0.04);
--shadow-md:    0 4px 12px rgba(0,0,0,0.06);
--shadow-lg:    0 8px 24px rgba(0,0,0,0.08);
--shadow-xl:    0 16px 48px rgba(0,0,0,0.10);
```

**Philosophy:** Subtle and grounded. Shadows should be barely noticeable — they indicate depth without calling attention to themselves. No dramatic drop shadows or glowing effects.

### Motion System

| Property | Value | Rationale |
|---|---|---|
| Default duration | 300ms | Slower than typical UI (250ms). Deliberate and calm. |
| Duration range | 250-400ms | Never faster than 200ms, never slower than 500ms. |
| Easing (enter) | `cubic-bezier(0.16, 1, 0.3, 1)` | Ease-out. Natural settling, not mechanical. |
| Easing (exit) | `cubic-bezier(0.4, 0, 1, 1)` | Faster exit than enter. Doesn't linger. |
| Hover interaction | translateY(-2px) + shadow increase | Subtle lift. Never scale. Never color flash. |
| Page transition | Cross-fade + 15px vertical slide | Smooth, almost imperceptible. |
| Card enter | Fade in + 20px slide up, staggered | Cards arrive gently, not all at once. |
| Confirmation | Smooth checkmark draw, then fade to stable | Satisfying without being dopamine-driven. |
| Loading | Skeleton pulse — very soft, 1500ms cycle | Never a spinner in primary surfaces. |

**Forbidden animations:** bounce, elastic, spring (overly playful), parallax (disorienting), particles (distracting), confetti (gamified), shake (anxiety-inducing).

### Component Inventory

#### Surfaces (custom — Elora's visible identity)

| Component | Emotional Role | Visual |
|---|---|---|
| **`VaultStateCard`** | "This is where your capital is." | Large card showing one capital state (Available / In Motion / Protected). Generous internal padding (24px+). Single large number. Calm label. |
| **`ProtectedCapitalPanel`** | "Your locked capital is safe and growing." | Timeline of active locks. Each lock as a card with horizon label, amount, release date, progress indicator. |
| **`HorizonCard`** | "Choose your discipline period." | Giant selectable card. Large typography. Calm description. Size: minimum 160px tall, full-width on mobile. |
| **`DecisionSurface`** | "One choice, one moment." | Full-page or full-panel binary choice. Two large cards side by side (stacked on mobile). No other UI competing. |
| **`ActivityMomentCard`** | "This happened." | Single timeline entry. Spacious layout. Type label, amount, date, subtle color coding. Never condensed into table rows. |
| **`BalanceDisplay`** | "Here's your number." | Large, clean number display. Tabular figures. Subtle label above. No sparklines, charts, or decoration. |
| **`ConfirmationSheet`** | "Does this feel right?" | Bottom sheet (mobile) or modal (desktop). Soft overlay. Summary of the decision. Two buttons: confirm (green) and reconsider (text link). |
| **`IntentFlow`** | "Step by step. One decision at a time." | Wizard-like flow. Each step is a full DecisionSurface. Progress indicator (subtle dots or line). Back is always available. |

#### Navigation (custom)

| Component | Notes |
|---|---|
| **`Sidebar`** (desktop) | Slim, icon + text. Vault as active default. Settings at bottom, visually smaller. |
| **`BottomTab`** (mobile) | 3 tabs: Vault, Activity, Intent. Settings via gear icon in top bar. |
| **`WalletPill`** | Tiny pill in nav showing connected wallet state. Never a prominent element. |

#### Feedback (custom UI, may use shadcn behaviors)

| Component | Notes |
|---|---|
| **`StatusPill`** | Tiny colored pill for capital states. Green (Protected), subtle gray (Available), soft amber (In Motion). |
| **`Toast`** | shadcn Toast component, restyled. Soft green for success, quiet gray for info. Never red except critical errors. |
| **`LoadingSkeleton`** | Soft pulse skeleton matching card shapes. Never a spinner for primary content. |

#### Primitives (shadcn — invisible accessibility + behavior)

| Component | Keep For |
|---|---|
| **Dialog** | Modal confirmations, detail views |
| **DropdownMenu** | Settings overflow, filter menus |
| **Tabs** | Within-page sections (e.g., Vault state tabs on mobile) |
| **Sheet** | Bottom sheets, mobile drawers, settings panel |
| **Toast** | Notification system (restyled) |
| **Select** | Form inputs (rarely used) |

**Rule:** shadcn primitives should provide invisible accessibility and behavior. Elora's visible surfaces should look entirely custom — white, green, spacious, and emotionally distinct.

---

## Implementation: First Build Pass (Design System Foundation)

The immediate implementation scope is **design system foundation only** — no full page rebuilds. The following steps will be executed first, then reviewed before proceeding.

**Sequencing principle:** The navigation shell comes BEFORE most components. The shell determines emotional pacing and layout rhythm. If the shell feels wrong, beautiful components won't save the experience.

### Step 1: Global CSS Design Tokens
- Define all CSS custom properties in `src/app/globals.css`
- Colors, spacing, radius, shadows, typography, motion
- Replace existing Tailwind theme to align with new tokens

### Step 2: Typography Setup
- Import Inter font (next/font or @fontsource)
- Define text style utility classes
- Update tailwind config font settings

### Step 3: Color System
- Replace existing color variables with new palette
- Ensure proper contrast ratios for accessibility (WCAG AA)
- Dark mode consideration: if needed, a very soft warm dark variant (deferred)

### Step 4: Spacing System & Layout Rhythm
- Apply generous spacing to page layouts
- Define global container widths, section gaps, page margins
- Ensure consistent vertical rhythm

### Step 5: Navigation Shell (Desktop + Mobile)
- Build new sidebar navigation (desktop) — slim, icon + text
- Build bottom tab navigation (mobile) — 3 tabs
- Wire up 4 destinations: Vault, Activity, Intent, Settings
- Old pages remain functional at their old routes with old content — navigation shell works on top

### Step 6: Layout Containers
- Define page-level layout components (PageShell, Section)
- Ensure consistent responsive behavior

### Step 7: Base Surface Components (Foundational)
- Build `VaultStateCard` — the foundational surface component
- Build `HorizonCard` — the decision card primitive
- Build `StatusPill` — state indicator

### Step 8: State Cards
- Build `ProtectedCapitalPanel` (lock timeline)
- Build `BalanceDisplay`
- Build `WalletPill`

### Step 9: Decision Surfaces (Primed, not wired into flows yet)
- Build `DecisionSurface` — binary choice container
- Build `IntentFlow` — step container
- Build `ConfirmationSheet`

### Not Building Yet
- Landing page rebuild
- Vault page full rebuild
- Intent page (decision flows)
- Activity page (timeline)
- Settings page simplification
- Full page transitions and motion

---

## Future Phases (Out of Scope for This Spec)

| Phase | Content | Dependency |
|---|---|---|
| Phase 3 | Landing page rebuild | Design system foundation complete |
| Phase 4 | Vault UX rebuild | Phase 3 complete |
| Phase 5 | Intent page (decision flows) | Phase 4 complete |
| Phase 6 | Activity page (timeline) | Phase 5 complete |
| Phase 7 | Mobile polish + motion refinement | All pages rebuilt |

---

## Review History

| Date | Reviewer | Changes |
|---|---|---|
| 2026-05-30 | Design approval | Phase 1 UX architecture approved. Phase 2 language + design system approved with refinements: Intent clarified as decision space, state labels with definitions, implementation scoped to foundation. |
| 2026-05-30 | Refinements | Added: "Protected" restraint guidelines, Intent empty state, binary decision rules, anti-wellness tone boundary, architectural-calm balance, Base-native philosophy, corrected implementation sequencing (shell before components), strengthened mobile priority. |
| 2026-05-30 | Strategic constraints | Added 6 binding implementation constraints: fewer components, backend stability, anti-density, 10-minute test, expensive restraint, Intent as signature experience. |
