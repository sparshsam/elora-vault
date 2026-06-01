"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/page-shell";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      <style>{`
        @keyframes elora-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .elora-fade-1 { animation: elora-fade-up 0.7s ease-out forwards; }
        .elora-fade-2 { animation: elora-fade-up 0.7s ease-out 0.15s forwards; opacity: 0; }
        .elora-fade-3 { animation: elora-fade-up 0.7s ease-out 0.3s forwards; opacity: 0; }
      `}</style>

      {/* ── Navigation ──────────────────────── */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 bg-green-50">
              <Shield className="h-4 w-4 text-green-700" />
            </div>
            <span className="text-base font-semibold tracking-tight text-text-primary">
              Elora
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-small text-text-secondary transition-colors hover:text-text-primary"
            >
              Sign in
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-green-500 text-white hover:bg-green-600 rounded-lg px-5 py-2 text-small font-medium transition-all shadow-sm">
                Create your vault
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Section 1 — Hero ────────────────── */}
      <section className="elora-fade-1 pt-32 md:pt-40">
        <div className="mx-auto max-w-4xl px-6 pb-24 text-center md:pb-32">
          <h1 className="text-4xl font-light leading-[1.1] tracking-tight text-text-primary sm:text-5xl md:text-hero">
            Protect your capital
            <br />
            <span className="text-green-600">from yourself.</span>
          </h1>
          <p className="elora-fade-2 mx-auto mt-6 max-w-xl text-body leading-relaxed text-text-secondary">
            Not every dollar should feel equally available.
            <br />
            Elora creates separation between capital you can
            <br />
            access immediately and capital you want protected.
          </p>
          <div className="elora-fade-3 mt-10 flex items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button className="bg-green-500 text-white hover:bg-green-600 rounded-xl px-8 py-3 text-base font-medium transition-all shadow-sm">
                Create your vault
              </Button>
            </Link>
            <Link
              href="/auth/login"
              className="text-small text-text-secondary transition-colors hover:text-text-primary"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Section 2 — Three States ────────── */}
      <section className="bg-surface-subtle py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-display font-light text-text-primary">
            Separate availability from protection
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-body text-text-secondary">
            A clear distinction between capital you can use now and capital you have chosen to keep apart.
          </p>
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            {/* Available */}
            <div className="rounded-xl border border-border bg-surface shadow-sm p-8 transition-all duration-300 hover:border-border-hover hover:shadow-md">
              <h3 className="text-heading mb-2 text-text-primary">Available</h3>
              <p className="text-body leading-relaxed text-text-secondary">
                Capital ready to use now.
              </p>
            </div>
            {/* Protected */}
            <div className="rounded-xl border border-green-200/50 bg-green-50/30 shadow-sm p-8 transition-all duration-300 hover:shadow-md">
              <h3 className="text-heading mb-2 text-green-700">Protected</h3>
              <p className="text-body leading-relaxed text-text-secondary">
                Capital intentionally separated from impulse.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3 — Why Separation ──────── */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="mb-10 text-display font-light text-text-primary">
            Most financial products optimize movement.
            <br />
            <span className="text-green-600">
              Elora introduces separation.
            </span>
          </h2>
          <div className="space-y-5 text-left text-body leading-relaxed text-text-secondary">
            <p>
              It creates distance between capital you can access
              immediately and capital you want protected from
              impulsive decisions.
            </p>
            <p>
              That distance is the difference between wanting
              something and acting on it. Most financial tools
              collapse it. Elora preserves it.
            </p>
            <p>
              Your capital remains yours. Always.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 4 — Infrastructure ──────── */}
      <section className="bg-surface-subtle py-16 md:py-20">
        <PageShell className="!py-0 text-center">
          <div className="mx-auto max-w-lg rounded-xl border border-border bg-surface shadow-sm p-8">
            <p className="text-small leading-relaxed text-text-secondary">
              Quiet by default.
              <br />
              Present when needed.
              <br />
              Invisible when not.
            </p>
            <p className="mt-3 text-tiny text-text-tertiary">
              Behavioral capital infrastructure for intentional separation.
            </p>
          </div>
        </PageShell>
      </section>

      {/* ── Section 5 — Final CTA ───────────── */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="mb-4 text-display font-light text-text-primary">
            Clearer capital separation.
          </h2>
          <p className="mx-auto mb-10 max-w-sm text-body text-text-secondary">
            No urgency. No noise.
          </p>
          <Link href="/auth/signup">
            <Button className="bg-green-500 text-white hover:bg-green-600 rounded-xl px-10 py-3 text-base font-medium transition-all shadow-sm">
              Create your vault
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────── */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-tiny text-text-muted">
            Elora - Behavioral capital infrastructure
          </p>
        </div>
      </footer>
    </div>
  );
}
