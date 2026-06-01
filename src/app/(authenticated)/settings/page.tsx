"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import { LogOut, User, Clock, Shield } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { address, isConnected } = useAccount();
  const [email, setEmail] = useState("");
  const [defaultDuration, setDefaultDuration] = useState<7 | 30 | 90>(30);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);
    };
    getUser();
    const savedDuration = localStorage.getItem("elora_vault_default_duration");
    if (savedDuration) {
      const d = parseInt(savedDuration);
      if ([7, 30, 90].includes(d)) setDefaultDuration(d as 7 | 30 | 90);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDurationChange = (d: 7 | 30 | 90) => {
    setDefaultDuration(d);
    localStorage.setItem("elora_vault_default_duration", d.toString());
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 md:py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
        <p className="text-small text-text-tertiary mt-1.5">
          A quiet place to configure your environment.
        </p>
      </div>

      {/* Account */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-text-tertiary" />
          <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
            Account
          </h2>
        </div>
        <div className="rounded-xl border border-border bg-surface shadow-sm px-5 py-4">
          <div>
            <p className="text-tiny text-text-tertiary mb-0.5">Email</p>
            <p className="text-sm text-text-primary">
              {email || "Loading..."}
            </p>
          </div>
          {isConnected && shortAddress && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-tiny text-text-tertiary mb-0.5">
                Connected wallet
              </p>
              <p className="text-sm font-mono text-text-primary">
                {shortAddress}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preferences */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-text-tertiary" />
          <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
            Preferences
          </h2>
        </div>

        {/* Default Lock Duration */}
        <div className="rounded-xl border border-border bg-surface px-5 py-4 mb-3">
          <p className="text-sm font-medium text-text-primary mb-1">
            Default lock duration
          </p>
          <p className="text-small text-text-tertiary mb-4">
            How long new capital protections last by default.
          </p>
          <div className="flex gap-2">
            {([7, 30, 90] as const).map((d) => (
              <button
                key={d}
                onClick={() => handleDurationChange(d)}
                className={cn(
                  "flex-1 h-9 rounded-lg text-xs font-medium border transition-all",
                  defaultDuration === d
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-border bg-surface-subtle text-text-tertiary hover:text-text-secondary hover:border-border-hover",
                )}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>

        {/* Notifications placeholder */}
        <div className="rounded-xl border border-border bg-surface px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary mb-0.5">
                Lock expiry notifications
              </p>
              <p className="text-small text-text-tertiary">
                Get notified when protected capital unlocks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors shrink-0 ml-4",
                notificationsEnabled ? "bg-green-500" : "bg-surface-hover",
              )}
              disabled
            >
              <div
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                  notificationsEnabled
                    ? "translate-x-[22px]"
                    : "translate-x-0.5",
                )}
              />
            </button>
          </div>
          <p className="text-tiny text-text-subtle mt-2 italic">
            Future-ready — available when notifications are supported.
          </p>
        </div>
      </div>

      {/* Infrastructure */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-text-tertiary" />
          <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
            Infrastructure
          </h2>
        </div>
        <div className="space-y-3">
          {/* Base Account */}
          <div className="rounded-xl border border-border bg-surface shadow-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary mb-0.5">
                  Base Account
                </p>
                <p className="text-small text-text-tertiary">
                  Future account infrastructure for calmer self-custody.
                </p>
                <p className="text-tiny text-text-muted mt-2 leading-relaxed">
                  Elora currently uses external wallet connections. Base Account
                  support is being explored to reduce wallet friction while
                  preserving ownership.
                </p>
              </div>
              <a
                href="/settings/base-account-lab"
                className="shrink-0 rounded-lg border border-green-200 bg-green-50 text-green-700 px-3 py-1.5 text-tiny font-medium hover:bg-green-100 transition-colors"
              >
                Open lab
              </a>
            </div>
          </div>

          {/* Productive Protection Research */}
          <div className="rounded-xl border border-border bg-surface shadow-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary mb-0.5">
                  Productive Protection
                </p>
                <p className="text-small text-text-tertiary">
                  Future optional low-risk yield for protected capital.
                </p>
                <p className="text-tiny text-text-muted mt-2 leading-relaxed">
                  Protected capital may eventually support optional low-risk
                  productivity while remaining separated. This is a research
                  surface — no yield strategies are active.
                </p>
              </div>
              <a
                href="/settings/productive-protection"
                className="shrink-0 rounded-lg border border-border bg-surface-subtle text-text-secondary px-3 py-1.5 text-tiny font-medium hover:text-text-primary hover:bg-surface-hover transition-colors"
              >
                View research
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-small text-text-tertiary hover:text-danger transition-colors"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </button>
    </div>
  );
}
