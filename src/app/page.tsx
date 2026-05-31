"use client";

import Link from "next/link";
import { Shield, CheckCircle, Lock, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/page-shell";

const states = [
  {
    icon: CheckCircle,
    title: "Available",
    description:
      "Money you can use freely. No strings, no waiting.",
  },
  {
    icon: Lock,
    title: "Protected",
    description:
      "Capital you have committed to keep aside until a future date.",
  },
  {
    icon: Activity,
    title: "In Motion",
    description:
      "Funds actively working toward the goals that matter to you.",
  },
];

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

      {/* Section 1 — Recognition Hero */}
      <section className="elora-fade-1 pt-32 md:pt-40">
        <div className="mx-auto max-w-4xl px-6 pb-24 text-center md:pb-32">
          <h1 className="text-4xl font-light leading-[1.1] tracking-tight text-text-primary sm:text-5xl md:text-hero">
            Protect your capital
            <br />
            <span className="text-green-600">from yourself.</span>
          </h1>
          <p className="elora-fade-2 mx-auto mt-6 max-w-2xl text-body leading-relaxed text-text-secondary">
            Elora helps you separate available money from protected money
            using intentional financial horizons.
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

      {/* Section 2 — The Three States */}
      <section className="bg-surface-subtle py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-display font-light text-text-primary">
            Three states of capital
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-body text-text-secondary">
            Every dollar you have is in one of three places. Elora makes
            each one distinct.
          </p>
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            {states.map((state) => (
              <div
                key={state.title}
                className="rounded-xl border border-border bg-surface shadow-sm p-8 transition-all duration-300 hover:border-border-hover hover:shadow-md"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-green-200 bg-green-50">
                  <state.icon className="h-6 w-6 text-green-700" />
                </div>
                <h3 className="text-heading mb-2 text-text-primary">
                  {state.title}
                </h3>
                <p className="text-body leading-relaxed text-text-secondary">
                  {state.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 — Why Elora Exists */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="mb-10 text-display font-light text-text-primary">
            Most financial tools help you move money.
            <br />
            <span className="text-green-600">
              Very few help you pause.
            </span>
          </h2>
          <div className="space-y-5 text-left text-body leading-relaxed text-text-secondary">
            <p>
              We build tools for the gap between impulse and action. That
              gap is where good financial decisions live — and where most
              tools are silent.
            </p>
            <p>
              Elora is designed for the version of you that knows what
              matters, even when the present version wants something else.
              Not by restricting you, but by giving your future self a
              voice in today&apos;s choices.
            </p>
            <p>
              Separating what you can spend from what you have committed
              is an act of infrastructure. Elora is that infrastructure —
              quiet, structural, and completely yours.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4 — Quiet Infrastructure */}
      <section className="bg-surface-subtle py-16 md:py-20">
        <PageShell className="!py-0 text-center">
          <div className="mx-auto max-w-lg rounded-xl border border-border bg-surface shadow-sm p-8">
            <p className="text-small leading-relaxed text-text-secondary">
              Built on{" "}
              <span className="font-medium text-text-primary">Base</span>.
              Self-custodied by default.
            </p>
            <p className="mt-2 text-tiny text-text-tertiary">
              Your capital remains yours. Always.
            </p>
          </div>
        </PageShell>
      </section>

      {/* Section 5 — Gentle Entry */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="mb-4 text-display font-light text-text-primary">
            Ready when you are.
          </h2>
          <p className="mx-auto mb-10 max-w-sm text-body text-text-secondary">
            No rush. No pressure. The infrastructure is here when you need
            it.
          </p>
          <Link href="/auth/signup">
            <Button className="bg-green-500 text-white hover:bg-green-600 rounded-xl px-10 py-3 text-base font-medium transition-all shadow-sm">
              Create your vault
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-tiny text-text-tertiary/70">
            Elora Vault &mdash; Behavioral capital infrastructure
          </p>
        </div>
      </footer>
    </div>
  );
}
