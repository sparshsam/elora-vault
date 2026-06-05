"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/vault");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* ── Navigation ── */}
      <nav className="border-b border-border bg-surface/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 bg-green-50">
              <Shield className="h-4 w-4 text-green-700" />
            </div>
            <span className="text-base font-semibold tracking-tight text-text-primary">
              Elora
            </span>
          </Link>
          <Link
            href="/auth/signup"
            className="text-small text-text-secondary transition-colors hover:text-text-primary"
          >
            Create your vault
          </Link>
        </div>
      </nav>

      {/* ── Auth Content ── */}
      <main className="flex-1 flex items-center justify-center px-6 py-16 md:py-24">
        <div className="w-full max-w-sm">
          {/* Back to home */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-small text-text-tertiary hover:text-text-secondary transition-colors mb-10"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-display font-light text-text-primary">
              Welcome back
            </h1>
            <p className="text-body text-text-secondary mt-1.5">
              Sign in to your vault to continue.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-small font-medium text-text-primary mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-lg border border-border bg-surface-subtle px-4 py-2.5 text-small text-text-primary placeholder:text-text-muted focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400/40 transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-small font-medium text-text-primary mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg border border-border bg-surface-subtle px-4 py-2.5 text-small text-text-primary placeholder:text-text-muted focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400/40 transition-colors"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-danger/8 border border-danger/20 px-4 py-3">
                <p className="text-small text-danger">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-lg text-small font-medium transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-8 text-center text-small text-text-tertiary">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-green-600 hover:text-green-700 transition-colors"
            >
              Create your vault
            </Link>
          </p>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-tiny text-text-muted">
            Elora Vault - Behavioral capital infrastructure
          </p>
        </div>
      </footer>
    </div>
  );
}
