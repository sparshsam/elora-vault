# Elora Vault — Design System Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing dark crypto-themed UI with the new white + green design system foundation — design tokens, typography, color system, spacing, navigation shell, layout containers, and base surface components. No full page rebuilds yet.

**Architecture:** Tailwind v4 with CSS-first configuration (`@theme inline` in globals.css). All design tokens are CSS custom properties. Components use `cn()` utility from `@/lib/utils` for class merging. shadcn primitives are restyled via CSS variables. New custom components live in `src/components/` organized by domain. Navigation shell wraps existing pages without changing their content.

**Tech Stack:** Next.js 16, Tailwind CSS v4, shadcn/ui (for primitives only), Inter font (already imported), Lucide icons, framer-motion (for motion transitions), `@/lib/utils` (cn utility)

**Key constraints:**
- Build fewer components than feels comfortable — merge if emotionally similar
- No backend logic rewrites — UI wraps existing flows
- No dashboard density creep — total information goes down, not up
- Intent is the signature experience — protect it with strict rules
- Each component must pass the "10-minute calmness test"
- Mobile-first: phone in hand, single thumb, one decision at a time

---

## File Structure

### Target Files

#### Design Tokens (globals.css — replace existing)
| File | Action | Purpose |
|---|---|---|
| `src/app/globals.css` | **Modify** | Replace dark/indigo theme with white + green tokens. Remove glassmorphism utility, add new text/radius/spacing/motion tokens. |

#### Typography
| File | Action | Purpose |
|---|---|---|
| `src/app/layout.tsx` | **Modify** (minor) | Inter already imported — confirm variable naming; update themeColor. |
| `tailwind.config.ts` | **Maybe create** | Only if Tailwind v4 v4 needs explicit config for some tokens (otherwise CSS-only). |

#### Navigation Shell
| File | Action | Purpose |
|---|---|---|
| `src/components/layout/sidebar.tsx` | **Rewrite** | New 4-item nav (Vault, Activity, Intent, Settings). White + green styling. Wallet pill. |
| `src/components/layout/mobile-nav.tsx` | **Rewrite** | 3-item bottom tab (Vault, Activity, Intent). Settings via gear icon. |
| `src/components/layout/wallet-pill.tsx` | **Create** | Tiny wallet connection pill for sidebar |
| `src/app/dashboard/layout.tsx` | **Modify** | Update to include new sidebar/mobile-nav. Rename if needed (can keep as is for now). |
| `src/app/layout.tsx` | **Modify** (minor) | Remove forced dark class from html element. |

#### Layout Containers
| File | Action | Purpose |
|---|---|---|
| `src/components/layout/page-shell.tsx` | **Create** | Main page wrapper — consistent max-width, padding, vertical rhythm |
| `src/components/layout/section.tsx` | **Create** | Section divider with optional title, consistent spacing |
| `src/components/layout/header-bar.tsx` | **Create** | Top bar for mobile — gear icon (settings), page title |

#### Base Surface Components
| File | Action | Purpose |
|---|---|---|
| `src/components/ui/card.tsx` | **Rewrite** | New white + green card styling. Keep radix-compatible API. |
| `src/components/ui/button.tsx` | **Read + assess** | May just need CSS variable updates via globals.css |
| `src/components/vault/vault-state-card.tsx` | **Create** | Foundational surface showing one capital state (Available / In Motion / Protected) |
| `src/components/vault/horizon-card.tsx` | **Create** | Giant selectable card for horizon/discipline period selection |
| `src/components/ui/status-pill.tsx` | **Create** | Tiny colored pill for capital state indicators |

#### State Cards
| File | Action | Purpose |
|---|---|---|
| `src/components/vault/protected-capital-panel.tsx` | **Create** | Lock timeline panel — shows active locks as cards |
| `src/components/vault/balance-display.tsx` | **Create** | Large, clean balance display (tabular figures, subtle label) |
| `src/components/web3/wallet-card.tsx` | **Read + assess** | May just need styling pass |

#### Decision Surfaces
| File | Action | Purpose |
|---|---|---|
| `src/components/actions/decision-surface.tsx` | **Create** | Binary choice container — two giant cards side by side |
| `src/components/actions/intent-flow.tsx` | **Create** | Step container for multi-step Intent flows |
| `src/components/actions/confirmation-sheet.tsx` | **Create** | Confirmation bottom sheet / modal |

#### Supporting
| File | Action | Purpose |
|---|---|---|
| `src/middleware.ts` | **Modify** | Add new protected paths (`/activity`, `/intent`). Update redirect target from `/dashboard` to `/vault`. |

---

## Tasks

### Task 1: Global CSS Design Tokens — Replace Dark Theme with White + Green

**Files:**
- Modify: `src/app/globals.css` (entire file)

- [ ] **Step 1: Replace the entire globals.css with the new token system**

Replace everything in `src/app/globals.css` with:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

/* ── Design Tokens ────────────────────────── */
/* Elora Vault — white + green, architectural calm */

@theme inline {
  /* Typography */
  --font-sans: var(--font-sans);
  --font-mono: var(--font-geist-mono);

  /* Text sizes */
  --text-hero: 4rem;
  --text-hero--line-height: 1.1;
  --text-hero--font-weight: 300;
  --text-display: 2.25rem;
  --text-display--line-height: 1.2;
  --text-display--font-weight: 400;
  --text-heading: 1.5rem;
  --text-heading--line-height: 1.3;
  --text-heading--font-weight: 500;
  --text-subheading: 1.125rem;
  --text-subheading--line-height: 1.4;
  --text-subheading--font-weight: 500;
  --text-body: 1rem;
  --text-body--line-height: 1.6;
  --text-small: 0.875rem;
  --text-small--line-height: 1.5;
  --text-tiny: 0.75rem;
  --text-tiny--line-height: 1.4;
  --text-number: 3rem;
  --text-number--line-height: 1;
  --text-number--font-weight: 300;

  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  --space-3xl: 4rem;
  --space-4xl: 6rem;
  --space-5xl: 8rem;

  /* Border Radius */
  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.08);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.10);

  /* Motion */
  --ease-elora: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-normal: 300ms;
  --duration-slow: 400ms;

  /* ── Color Tokens ──────────────────── */
  /* Surfaces */
  --color-surface: #ffffff;
  --color-surface-subtle: #f8faf8;
  --color-surface-hover: #f3f5f3;

  /* Borders */
  --color-border: #e8ebe8;
  --color-border-hover: #d0d5d0;

  /* Text */
  --color-text-primary: #1a1d1a;
  --color-text-secondary: #5a5e5a;
  --color-text-tertiary: #a0a5a0;
  --color-text-inverse: #ffffff;

  /* Green — Protection, Growth, Calm Discipline */
  --color-green-50: #f0fdf4;
  --color-green-100: #dcfce7;
  --color-green-200: #bbf7d0;
  --color-green-400: #4ade80;
  --color-green-500: #22c55e;
  --color-green-600: #16a34a;
  --color-green-700: #15803d;

  /* Semantic (rarely used) */
  --color-success: var(--color-green-500);
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-info: #3b82f6;

  /* ── shadcn Compatibility Map ──────── */
  --background: var(--color-surface);
  --foreground: var(--color-text-primary);
  --card: var(--color-surface);
  --card-foreground: var(--color-text-primary);
  --popover: var(--color-surface);
  --popover-foreground: var(--color-text-primary);
  --primary: var(--color-green-500);
  --primary-foreground: var(--color-text-inverse);
  --secondary: var(--color-surface-subtle);
  --secondary-foreground: var(--color-text-primary);
  --muted: var(--color-surface-subtle);
  --muted-foreground: var(--color-text-secondary);
  --accent: var(--color-surface-hover);
  --accent-foreground: var(--color-text-primary);
  --destructive: var(--color-danger);
  --destructive-foreground: var(--color-text-inverse);
  --border: var(--color-border);
  --input: var(--color-border);
  --ring: var(--color-green-400);
  --radius: 0.75rem;
  --sidebar: var(--color-surface);
  --sidebar-foreground: var(--color-text-primary);
  --sidebar-primary: var(--color-green-500);
  --sidebar-primary-foreground: var(--color-text-inverse);
  --sidebar-accent: var(--color-surface-hover);
  --sidebar-accent-foreground: var(--color-text-primary);
  --sidebar-border: var(--color-border);
  --sidebar-ring: var(--color-green-400);
}

/* ── Base Layer ──────────────────────── */
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-surface text-text-primary font-sans antialiased;
  }
}

/* ── Typography Utilities ────────────── */
.text-hero {
  font-size: var(--text-hero);
  line-height: var(--text-hero--line-height);
  font-weight: var(--text-hero--font-weight);
  letter-spacing: 0.02em;
}
.text-display {
  font-size: var(--text-display);
  line-height: var(--text-display--line-height);
  font-weight: var(--text-display--font-weight);
  letter-spacing: 0.02em;
}
.text-heading {
  font-size: var(--text-heading);
  line-height: var(--text-heading--line-height);
  font-weight: var(--text-heading--font-weight);
}
.text-number {
  font-size: var(--text-number);
  line-height: var(--text-number--line-height);
  font-weight: var(--text-number--font-weight);
  font-variant-numeric: tabular-nums;
}

/* ── Motion + Interaction ────────────── */
@media (prefers-reduced-motion: no-preference) {
  .motion-safe-transition {
    transition: all var(--duration-normal) var(--ease-elora);
  }
}

/* ── Mobile Touch Improvements ────────── */
@media (max-width: 768px) {
  button,
  a,
  [role="button"],
  input,
  select,
  textarea {
    min-height: 48px;
  }

  input[type="checkbox"],
  input[type="radio"] {
    min-height: auto;
  }

  main {
    -webkit-overflow-scrolling: touch;
  }

  body {
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
}

/* ── Utility: Prevent horizontal overflow ── */
html, body {
  overflow-x: hidden;
  max-width: 100vw;
}
```

- [ ] **Step 2: Verify globals.css compiles**

Run: `npx next build --no-lint 2>&1 | head -20`
Expected: Build succeeds or reports only expected errors (unused imports, not CSS failures).

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(design): replace dark theme with white + green design tokens"
```

---

### Task 2: Update Root Layout — Remove Forced Dark Mode

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update the root layout**

Remove the forced `dark` class from the `<html>` element. Update themeColor to match new palette.

Current:
```tsx
<html lang="en" className={`${inter.variable} h-full antialiased dark`}>
```

Change to:
```tsx
<html lang="en" className={`${inter.variable} h-full antialiased`}>
```

Also update themeColor in the viewport export:
```tsx
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};
```

- [ ] **Step 2: Verify layout renders**

No build step needed — this is a runtime change. But verify no errors in the terminal.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(design): remove forced dark mode, update theme color"
```

---

### Task 3: Update Middleware — Add New Routes, Redirect to Vault

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Update protected paths and redirect target**

Current:
```ts
const protectedPaths = ["/dashboard", "/bets", "/history", "/settings", "/deposit", "/transactions"];
```

Change to — add new routes, keep old ones for backward compat:
```ts
const protectedPaths = [
  "/dashboard", "/bets", "/history", "/settings", "/deposit", "/transactions",
  "/vault", "/activity", "/intent",
];
```

And change auth-page redirect from dashboard to vault:
```ts
if (user && request.nextUrl.pathname.startsWith("/auth")) {
  const url = request.nextUrl.clone();
  url.pathname = "/vault";
  return NextResponse.redirect(url);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(nav): add new routes to middleware, redirect auth to /vault"
```

---

### Task 4: Rewrite Sidebar — 4-Item Navigation, White + Green

**Files:**
- Modify: `src/components/layout/sidebar.tsx` (rewrite)

- [ ] **Step 1: Rewrite sidebar component**

Replace entire file content with:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Shield, Timeline, Target, Settings, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { WalletPill } from "./wallet-pill";

const navItems = [
  {
    href: "/vault",
    label: "Vault",
    icon: Shield,
  },
  {
    href: "/activity",
    label: "Activity",
    icon: Timeline,
  },
  {
    href: "/intent",
    label: "Intent",
    icon: Target,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <aside className="hidden md:flex flex-col w-56 border-r border-border bg-surface min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-6 border-b border-border">
        <div className="h-8 w-8 rounded-xl bg-green-500 flex items-center justify-center">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-semibold text-text-primary">Elora</span>
      </div>

      {/* Primary Nav */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-hover",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="px-3 pb-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            pathname === "/settings"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "text-text-tertiary hover:text-text-secondary hover:bg-surface-hover",
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>

      {/* Wallet Pill */}
      <div className="px-3 py-3 border-t border-border">
        <WalletPill />
      </div>

      {/* Sign out */}
      <div className="px-3 py-3 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-tertiary hover:text-danger hover:bg-red-50 transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
```

Note: `Timeline` is a Lucide icon — verify it exists (`npx lucide-react list`). If not, use `History` icon instead.

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "feat(nav): rewrite sidebar with 4-item white + green navigation"
```

---

### Task 5: Create WalletPill Component

**Files:**
- Create: `src/components/layout/wallet-pill.tsx`

- [ ] **Step 1: Create the WalletPill component**

```tsx
"use client";

import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import { Wallet } from "lucide-react";

export function WalletPill({ className }: { className?: string }) {
  const { address, isConnected } = useAccount();

  if (!isConnected || !address) {
    return (
      <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-subtle border border-border", className)}>
        <Wallet className="h-3.5 w-3.5 text-text-tertiary" />
        <span className="text-xs text-text-tertiary font-medium">Wallet not connected</span>
      </div>
    );
  }

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-subtle border border-border", className)}>
      <div className="h-2 w-2 rounded-full bg-green-500" />
      <span className="text-xs text-text-secondary font-mono font-medium">{shortAddress}</span>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/wallet-pill.tsx
git commit -m "feat(nav): add WalletPill component for sidebar wallet state"
```

---

### Task 6: Rewrite MobileNav — 3-Item Bottom Tab

**Files:**
- Modify: `src/components/layout/mobile-nav.tsx` (rewrite)

- [ ] **Step 1: Rewrite mobile nav component**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Shield, Timeline, Target } from "lucide-react";

const navItems = [
  {
    href: "/vault",
    label: "Vault",
    icon: Shield,
  },
  {
    href: "/activity",
    label: "Activity",
    icon: Timeline,
  },
  {
    href: "/intent",
    label: "Intent",
    icon: Target,
  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around py-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg transition-colors min-h-0",
                isActive
                  ? "text-green-600"
                  : "text-text-tertiary hover:text-text-secondary",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/mobile-nav.tsx
git commit -m "feat(nav): rewrite mobile nav with 3-item bottom tab"
```

---

### Task 7: Update Dashboard Layout — New Nav Components

**Files:**
- Modify: `src/app/dashboard/layout.tsx`

- [ ] **Step 1: Update layout to use new sidebar/mobile-nav**

The layout itself stays structurally the same — it already imports `Sidebar` and `MobileNav`. Just verify they render correctly. The key change is removing the forced dark background:

```tsx
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Web3Provider } from "@/lib/web3/providers";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Web3Provider>
      <div className="flex min-h-screen bg-surface">
        <Sidebar />
        <main className="flex-1 pb-20 md:pb-0 overflow-auto">
          {children}
        </main>
        <MobileNav />
      </div>
    </Web3Provider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/layout.tsx
git commit -m "feat(nav): update dashboard layout with white surface bg"
```

---

### Task 8: Create Layout Containers — PageShell and Section

**Files:**
- Create: `src/components/layout/page-shell.tsx`
- Create: `src/components/layout/section.tsx`

- [ ] **Step 1: Create PageShell**

```tsx
import { cn } from "@/lib/utils";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageShell — Consistent page wrapper.
 * Provides max-width, horizontal padding, and vertical spacing.
 * Every app page should use this as its root container.
 */
export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn("mx-auto w-full max-w-5xl px-6 py-8 md:py-10", className)}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create Section**

```tsx
import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

/**
 * Section — A vertical section with consistent spacing.
 * Optional title + description header.
 */
export function Section({ children, title, description, className }: SectionProps) {
  return (
    <section className={cn("mb-10", className)}>
      {title && (
        <div className="mb-6">
          <h2 className="text-heading text-text-primary">{title}</h2>
          {description && (
            <p className="text-body text-text-secondary mt-1">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/page-shell.tsx src/components/layout/section.tsx
git commit -m "feat(layout): add PageShell and Section layout containers"
```

---

### Task 9: Rewrite Card Component — White + Green Styling

**Files:**
- Modify: `src/components/ui/card.tsx` (rewrite styles)

- [ ] **Step 1: Rewrite card with new styling**

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-border bg-surface shadow-sm",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 pb-0", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold text-heading text-text-primary leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-text-secondary", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/card.tsx
git commit -m "feat(ui): restyle card component with white + green design"
```

---

### Task 10: Create StatusPill Component

**Files:**
- Create: `src/components/ui/status-pill.tsx`

- [ ] **Step 1: Create StatusPill**

```tsx
import { cn } from "@/lib/utils";

type StatusType = "available" | "in-motion" | "protected";

interface StatusPillProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const statusConfig: Record<StatusType, { color: string; defaultLabel: string }> = {
  available: {
    color: "bg-gray-200 text-gray-700",
    defaultLabel: "Available",
  },
  "in-motion": {
    color: "bg-amber-100 text-amber-700",
    defaultLabel: "In Motion",
  },
  protected: {
    color: "bg-green-100 text-green-700",
    defaultLabel: "Protected",
  },
};

/**
 * StatusPill — Tiny colored pill for capital state indicators.
 * Used within cards to show capital state at a glance.
 */
export function StatusPill({ status, label, className }: StatusPillProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-tiny font-medium",
        config.color,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      {label || config.defaultLabel}
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/status-pill.tsx
git commit -m "feat(ui): add StatusPill component for capital state indicators"
```

---

### Task 11: Create VaultStateCard Component

**Files:**
- Create: `src/components/vault/vault-state-card.tsx`

- [ ] **Step 1: Create VaultStateCard**

```tsx
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/ui/status-pill";

type StateType = "available" | "in-motion" | "protected";

interface VaultStateCardProps {
  state: StateType;
  amount: string; // Formatted amount string, e.g. "1,250.00"
  label?: string;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const stateStyles: Record<StateType, { bg: string; border: string }> = {
  available: {
    bg: "bg-surface",
    border: "border-border",
  },
  "in-motion": {
    bg: "bg-amber-50/50",
    border: "border-amber-200/50",
  },
  protected: {
    bg: "bg-green-50/50",
    border: "border-green-200/50",
  },
};

/**
 * VaultStateCard — Foundational surface showing one capital state.
 *
 * Emotional role: "This is where your capital is right now."
 * - Generous internal padding (24px)
 * - Single large number
 * - Calm label
 * - Optional click handler for "show more" or navigation
 */
export function VaultStateCard({
  state,
  amount,
  label,
  onClick,
  className,
  children,
}: VaultStateCardProps) {
  const style = stateStyles[state];
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === "Enter" || e.key === " ") onClick?.(); } : undefined}
      className={cn(
        "rounded-xl border p-6 md:p-8 transition-all duration-300",
        style.bg,
        style.border,
        isClickable && "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <StatusPill status={state} label={label} />
      </div>
      <p className="text-number text-text-primary">${amount}</p>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/vault/vault-state-card.tsx
git commit -m "feat(vault): add VaultStateCard component for capital state display"
```

---

### Task 12: Create HorizonCard Component

**Files:**
- Create: `src/components/vault/horizon-card.tsx`

- [ ] **Step 1: Create HorizonCard**

```tsx
"use client";

import { cn } from "@/lib/utils";
import { Sprout, Leaf, TreePine } from "lucide-react";

interface HorizonCardProps {
  id: string;
  title: string;
  description: string;
  duration: string; // e.g. "7 days"
  icon: "sprout" | "leaf" | "tree";
  selected?: boolean;
  onSelect?: (id: string) => void;
  className?: string;
}

const iconMap = {
  sprout: Sprout,
  leaf: Leaf,
  tree: TreePine,
};

/**
 * HorizonCard — Giant selectable card for horizon/discipline period selection.
 *
 * Emotional role: "Choose your discipline horizon."
 * - Large typography
 * - Calm, descriptive copy
 * - Minimum 160px tall
 * - Full-width on mobile
 * - Selected state with green border + background
 */
export function HorizonCard({
  id,
  title,
  description,
  duration,
  icon,
  selected,
  onSelect,
  className,
}: HorizonCardProps) {
  const Icon = iconMap[icon];

  return (
    <button
      type="button"
      onClick={() => onSelect?.(id)}
      className={cn(
        "relative flex flex-col items-start gap-3 rounded-xl border-2 p-6 md:p-8 text-left transition-all duration-300 min-h-[160px] w-full",
        selected
          ? "border-green-500 bg-green-50 shadow-sm"
          : "border-border bg-surface hover:border-green-200 hover:bg-surface-subtle hover:shadow-sm",
        className,
      )}
    >
      <div className={cn(
        "rounded-lg p-2.5",
        selected ? "bg-green-100 text-green-600" : "bg-surface-subtle text-text-secondary",
      )}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-heading font-semibold text-text-primary">{title}</h3>
        <p className="text-body text-text-secondary">{description}</p>
      </div>
      <span className={cn(
        "text-sm font-medium",
        selected ? "text-green-600" : "text-text-tertiary",
      )}>
        {duration}
      </span>
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/vault/horizon-card.tsx
git commit -m "feat(vault): add HorizonCard component for discipline period selection"
```

---

### Task 13: Create BalanceDisplay Component

**Files:**
- Create: `src/components/vault/balance-display.tsx`

- [ ] **Step 1: Create BalanceDisplay**

```tsx
import { cn } from "@/lib/utils";

interface BalanceDisplayProps {
  amount: string; // Formatted, e.g. "1,250.00"
  label: string;
  currency?: string;
  className?: string;
  size?: "default" | "large";
}

/**
 * BalanceDisplay — Clean, large number display for capital amounts.
 *
 * Emotional role: "Here's your number."
 * - Tabular figures for stable number alignment
 * - Subtle label above
 * - No sparklines, charts, or decoration
 * - Two sizes: default (text-number) and large (hero scale)
 */
export function BalanceDisplay({
  amount,
  label,
  currency = "USDC",
  className,
  size = "default",
}: BalanceDisplayProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <span className="text-tiny font-medium text-text-tertiary uppercase tracking-wide">
        {label}
      </span>
      <div className="flex items-baseline gap-1.5 mt-0.5">
        <span className={cn(
          size === "large" ? "text-hero" : "text-number",
          "font-light text-text-primary tabular-nums",
        )}>
          {amount}
        </span>
        <span className={cn(
          size === "large" ? "text-heading" : "text-body",
          "font-medium text-text-tertiary",
        )}>
          {currency}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/vault/balance-display.tsx
git commit -m "feat(vault): add BalanceDisplay component for capital amounts"
```

---

### Task 14: Create ProtectedCapitalPanel Component

**Files:**
- Create: `src/components/vault/protected-capital-panel.tsx`

- [ ] **Step 1: Create ProtectedCapitalPanel**

```tsx
import { cn } from "@/lib/utils";
import { Clock, ExternalLink } from "lucide-react";

interface LockItem {
  id: string;
  amount: string;
  releaseDate: string;
  progress: number; // 0-100
  txHash?: string;
  baseScanUrl?: string;
}

interface ProtectedCapitalPanelProps {
  locks: LockItem[];
  className?: string;
}

function LockCard({ lock }: { lock: LockItem }) {
  return (
    <div className="rounded-lg border border-green-200 bg-green-50/50 p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-lg font-semibold text-green-700">${lock.amount}</span>
        <span className="text-tiny font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
          Protected
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-tiny text-text-secondary mb-3">
        <Clock className="h-3 w-3" />
        <span>Releases {lock.releaseDate}</span>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-green-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-500"
          style={{ width: `${lock.progress}%` }}
        />
      </div>
      {lock.txHash && lock.baseScanUrl && (
        <a
          href={`${lock.baseScanUrl}/tx/${lock.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-3 text-tiny text-text-tertiary hover:text-green-600 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          View on BaseScan
        </a>
      )}
    </div>
  );
}

/**
 * ProtectedCapitalPanel — Lock timeline panel.
 *
 * Emotional role: "Your locked capital is safe and growing."
 * Shows active locks as individual cards with horizon label, amount,
 * release date, and progress indicator.
 */
export function ProtectedCapitalPanel({ locks, className }: ProtectedCapitalPanelProps) {
  if (locks.length === 0) {
    return (
      <div className={cn("rounded-xl border border-dashed border-border p-8 text-center", className)}>
        <p className="text-body text-text-tertiary">No capital is locked right now.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {locks.map((lock) => (
        <LockCard key={lock.id} lock={lock} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/vault/protected-capital-panel.tsx
git commit -m "feat(vault): add ProtectedCapitalPanel component for lock timeline"
```

---

### Task 15: Create DecisionSurface Component

**Files:**
- Create: `src/components/actions/decision-surface.tsx`

- [ ] **Step 1: Create directory and component**

```bash
mkdir -p src/components/actions
```

```tsx
"use client";

import { cn } from "@/lib/utils";

interface DecisionOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  value: string;
}

interface DecisionSurfaceProps {
  prompt: string;
  options: [DecisionOption, DecisionOption]; // Exactly two — binary choice
  selectedOption?: string | null;
  onSelect?: (optionId: string) => void;
  className?: string;
}

/**
 * DecisionSurface — Binary choice container.
 *
 * Emotional role: "One choice, one moment."
 * Two large cards side by side (stacked on mobile).
 * No other UI competing for attention.
 * The prompt is the only question the user needs to answer.
 *
 * This is the primary building block of the Intent page.
 */
export function DecisionSurface({
  prompt,
  options,
  selectedOption,
  onSelect,
  className,
}: DecisionSurfaceProps) {
  return (
    <div className={cn("w-full", className)}>
      <h2 className="text-display text-text-primary mb-8 text-balance">{prompt}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect?.(option.id)}
            className={cn(
              "flex flex-col items-start gap-4 rounded-xl border-2 p-6 md:p-8 text-left transition-all duration-300 min-h-[200px]",
              selectedOption === option.id
                ? "border-green-500 bg-green-50 shadow-sm"
                : "border-border bg-surface hover:border-green-200 hover:bg-surface-subtle hover:shadow-sm",
            )}
          >
            <div className={cn(
              "rounded-lg p-3",
              selectedOption === option.id ? "bg-green-100 text-green-600" : "bg-surface-subtle text-text-secondary",
            )}>
              {option.icon}
            </div>
            <div className="space-y-1">
              <h3 className="text-heading font-semibold text-text-primary">{option.title}</h3>
              <p className="text-body text-text-secondary">{option.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/actions/decision-surface.tsx
git commit -m "feat(intent): add DecisionSurface component for binary choices"
```

---

### Task 16: Create ConfirmationSheet Component

**Files:**
- Create: `src/components/actions/confirmation-sheet.tsx`

- [ ] **Step 1: Create ConfirmationSheet**

```tsx
"use client";

import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface ConfirmationSheetProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  className?: string;
}

/**
 * ConfirmationSheet — Confirmation bottom sheet / modal.
 *
 * Emotional role: "Does this feel right?"
 * - Soft overlay
 * - Summary of the decision
 * - Two buttons: confirm (green) and reconsider (text link)
 * - Bottom sheet on mobile, modal on desktop
 */
export function ConfirmationSheet({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Reconsider",
  loading = false,
  className,
}: ConfirmationSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Sheet */}
      <div
        className={cn(
          "relative w-full md:w-[420px] rounded-t-2xl md:rounded-2xl bg-surface border border-border shadow-xl p-6 md:p-8",
          "md:mb-0",
          className,
        )}
      >
        {/* Handle for mobile */}
        <div className="md:hidden flex justify-center mb-4">
          <div className="h-1.5 w-12 rounded-full bg-border" />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-full bg-green-100 p-2">
            <Check className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="text-heading font-semibold text-text-primary">{title}</h3>
        </div>

        {description && (
          <p className="text-body text-text-secondary mb-6">{description}</p>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full rounded-lg bg-green-500 text-white font-medium py-3 px-4 hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="w-full rounded-lg text-text-secondary font-medium py-2 px-4 hover:text-text-primary transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/actions/confirmation-sheet.tsx
git commit -m "feat(intent): add ConfirmationSheet component"
```

---

### Task 17: Create IntentFlow Component

**Files:**
- Create: `src/components/actions/intent-flow.tsx`

- [ ] **Step 1: Create IntentFlow**

```tsx
"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

interface IntentStep {
  id: string;
  label: string;
}

interface IntentFlowProps {
  steps: IntentStep[];
  currentStep: number; // 0-indexed
  onBack?: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * IntentFlow — Multi-step decision flow container.
 *
 * Emotional role: "Step by step. One decision at a time."
 * - Subtle progress indicator (dots or line)
 * - Back is always available
 * - Each step renders its content (usually a DecisionSurface)
 * - The progress indicator is intentionally minimal — not a wizard counter
 */
export function IntentFlow({
  steps,
  currentStep,
  onBack,
  children,
  className,
}: IntentFlowProps) {
  const isFirstStep = currentStep === 0;

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      {/* Progress indicator */}
      <div className="flex items-center gap-3 mb-8">
        {onBack && !isFirstStep && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex items-center gap-2">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2">
              <div
                className={cn(
                  "h-2 w-2 rounded-full transition-colors duration-300",
                  i <= currentStep ? "bg-green-500" : "bg-border",
                )}
              />
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "h-px w-6 transition-colors duration-300",
                    i < currentStep ? "bg-green-500" : "bg-border",
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <span className="text-tiny text-text-tertiary font-medium ml-auto">
          {steps[currentStep]?.label}
        </span>
      </div>

      {/* Step content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/actions/intent-flow.tsx
git commit -m "feat(intent): add IntentFlow component for multi-step decision flows"
```

---

### Task 18: Verify Build

- [ ] **Step 1: Run a build to verify everything compiles**

Run: `npx next build 2>&1 | tail -30`
Expected: Build succeeds. If errors occur, fix them inline (likely import path issues, missing Lucide icons, or type errors).

- [ ] **Step 2: Fix any issues found**

Common issues to watch for:
- `Timeline` Lucide icon may not exist → replace with `History` icon in sidebar.tsx and mobile-nav.tsx
- `animate-in`, `fade-in`, `slide-in-from-bottom-4` are Tailwind v4 animation utilities — they may need `tw-animate-css` import (already present) or manual keyframes
- `tabular-nums` is a standard font-variant utility — should work in Tailwind v4

If build succeeds, the foundation is ready.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: fix build issues from design system foundation"
```

---

## Self-Review Checklist

- **Spec coverage:** Does every spec requirement have a corresponding task?
  - ✅ Design tokens (Task 1)
  - ✅ Typography (Task 1 — tokens, Task 2 — layout)
  - ✅ Color system (Task 1)
  - ✅ Spacing system (Task 1 — tokens)
  - ✅ Navigation shell (Tasks 4, 5, 6, 7)
  - ✅ Layout containers (Task 8)
  - ✅ Card component restyle (Task 9)
  - ✅ StatusPill (Task 10)
  - ✅ VaultStateCard (Task 11)
  - ✅ HorizonCard (Task 12)
  - ✅ BalanceDisplay (Task 13)
  - ✅ ProtectedCapitalPanel (Task 14)
  - ✅ DecisionSurface (Task 15)
  - ✅ ConfirmationSheet (Task 16)
  - ✅ IntentFlow (Task 17)
  - ✅ Middleware updates (Task 3)
  - Not building yet: Landing, full Vault pages, Activity, Intent — deferred as specified

- **Placeholder scan:** No TBD, TODO, or incomplete sections in any task. All code is complete and concrete.

- **Type consistency:** Props interfaces are consistent across tasks. `StatusPill.status` uses `"available" | "in-motion" | "protected"` matching the spec's state labels. `HorizonCard.icon` uses `"sprout" | "leaf" | "tree"`. Function names match across tasks.

- **Constraint compliance:** 
  - No backend logic changes ✅
  - No new data model dependencies ✅
  - Fewer components than typical (16 new/modified files for the full foundation) ✅
  - Intent surfaces protected as separate focused components ✅
  - Mobile-first: all components consider mobile layout ✅
